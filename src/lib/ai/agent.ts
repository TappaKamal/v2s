import { generateJSON, generateText } from './gemini';
import { db } from '@/db';
import { tasks, goals, goalMilestones, habits, habitLogs, aiInsights } from '@/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// ──────────── Types ────────────

interface PrioritizedTask {
  id: string;
  score: number;
  reasoning: string;
}

interface DecomposedGoal {
  milestones: { title: string; order: number }[];
  estimatedDays: number;
  advice: string;
}

interface ScheduleBlock {
  taskId: string;
  taskTitle: string;
  startTime: string; // HH:mm
  endTime: string;
  reasoning: string;
}

interface RescuePlan {
  summary: string;
  steps: { action: string; priority: string }[];
  rescheduledTasks: { id: string; newDueDate: string }[];
}

interface ProductivityAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  tips: string[];
}

// ──────────── Tool: Prioritize Tasks ────────────

export async function prioritizeTasks(userId: string): Promise<PrioritizedTask[]> {
  const userTasks = await db.select().from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.status, 'pending')));

  if (userTasks.length === 0) return [];

  const taskList = userTasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    dueDate: t.dueDate,
    category: t.category,
    estimatedMinutes: t.estimatedMinutes,
  }));

  const now = new Date().toISOString();

  const result = await generateJSON<{ tasks: PrioritizedTask[] }>(
    `Current datetime: ${now}

Here are the user's pending tasks:
${JSON.stringify(taskList, null, 2)}

Analyze each task using the Eisenhower Matrix (urgent/important), deadline proximity, and estimated effort.
Score each task from 0-100 (100 = do immediately).

Return JSON: { "tasks": [{ "id": "...", "score": 85, "reasoning": "Due tomorrow, high priority, 30min task" }] }`,
    'You are an expert productivity AI. Prioritize tasks based on urgency, importance, deadline proximity, and effort. Be specific in reasoning.'
  );

  // Update scores in DB
  for (const t of result.tasks) {
    await db.update(tasks)
      .set({ aiPriorityScore: t.score, aiSuggestion: t.reasoning })
      .where(eq(tasks.id, t.id));
  }

  return result.tasks;
}

// ──────────── Tool: Decompose Goal ────────────

export async function decomposeGoal(goalId: string): Promise<DecomposedGoal> {
  const goalList = await db.select().from(goals).where(eq(goals.id, goalId));
  if (goalList.length === 0) throw new Error('Goal not found');
  const goal = goalList[0];

  const result = await generateJSON<DecomposedGoal>(
    `Goal: "${goal.title}"
Description: ${goal.description || 'N/A'}
Deadline: ${goal.deadline || 'No deadline set'}
Current date: ${new Date().toISOString().split('T')[0]}

Break this goal into 4-8 concrete, actionable milestones.
Each milestone should be specific and completable.

Return JSON: { "milestones": [{ "title": "...", "order": 1 }], "estimatedDays": 14, "advice": "Start with..." }`,
    'You are an expert goal-setting coach. Create SMART milestones that are specific, measurable, achievable, relevant, and time-bound.'
  );

  // Insert milestones into DB
  for (const m of result.milestones) {
    await db.insert(goalMilestones).values({
      id: uuidv4(),
      goalId: goalId,
      title: m.title,
      order: m.order,
    });
  }

  await db.update(goals).set({ aiDecomposed: true }).where(eq(goals.id, goalId));

  return result;
}

// ──────────── Tool: Generate Schedule ────────────

export async function generateSchedule(userId: string, date: string): Promise<ScheduleBlock[]> {
  const userTasks = await db.select().from(tasks)
    .where(and(
      eq(tasks.userId, userId),
      eq(tasks.status, 'pending')
    ));

  if (userTasks.length === 0) return [];

  const taskList = userTasks.map(t => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    estimatedMinutes: t.estimatedMinutes || 30,
    dueDate: t.dueDate,
    category: t.category,
  }));

  const result = await generateJSON<{ schedule: ScheduleBlock[] }>(
    `Date: ${date}
Working hours: 9:00 AM to 6:00 PM
Available tasks:
${JSON.stringify(taskList, null, 2)}

Create a time-blocked schedule. Put high-priority and cognitively demanding tasks in the morning. Include 15-min breaks between blocks. Leave lunch from 12:30-1:30.

Return JSON: { "schedule": [{ "taskId": "...", "taskTitle": "...", "startTime": "09:00", "endTime": "09:30", "reasoning": "..." }] }`,
    'You are an expert time management AI. Create optimal schedules based on task priority, cognitive load, and energy patterns.'
  );

  // Save schedule to DB
  for (const block of result.schedule) {
    await db.update(tasks)
      .set({
        scheduledStart: `${date}T${block.startTime}:00`,
        scheduledEnd: `${date}T${block.endTime}:00`,
      })
      .where(eq(tasks.id, block.taskId));
  }

  return result.schedule;
}

// ──────────── Tool: Rescue Overdue ────────────

export async function rescueOverdue(userId: string): Promise<RescuePlan> {
  const now = new Date().toISOString();
  const userTasks = await db.select().from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.status, 'pending')));

  const overdue = userTasks.filter(t => t.dueDate && t.dueDate < now);
  const upcoming = userTasks.filter(t => !t.dueDate || t.dueDate >= now);

  if (overdue.length === 0) {
    return {
      summary: 'No overdue tasks! You\'re on track.',
      steps: [],
      rescheduledTasks: [],
    };
  }

  const result = await generateJSON<RescuePlan>(
    `Current datetime: ${now}

OVERDUE tasks:
${JSON.stringify(overdue.map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority })), null, 2)}

UPCOMING tasks:
${JSON.stringify(upcoming.slice(0, 10).map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority })), null, 2)}

Create a rescue plan:
1. Triage overdue tasks (which can be salvaged, which need rescheduling)
2. Suggest new realistic due dates
3. Provide actionable recovery steps

Return JSON: { "summary": "...", "steps": [{ "action": "...", "priority": "high" }], "rescheduledTasks": [{ "id": "...", "newDueDate": "2025-01-15" }] }`,
    'You are a crisis management productivity coach. Help users recover from missed deadlines with empathy and practical steps.'
  );

  // Apply reschedules
  for (const rt of result.rescheduledTasks) {
    await db.update(tasks)
      .set({ dueDate: rt.newDueDate })
      .where(eq(tasks.id, rt.id));
  }

  // Save insight
  await db.insert(aiInsights).values({
    id: uuidv4(),
    userId,
    type: 'rescue_plan',
    content: result.summary,
  });

  return result;
}

// ──────────── Tool: Analyze Productivity ────────────

export async function analyzeProductivity(userId: string): Promise<ProductivityAnalysis> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const completedTasks = await db.select().from(tasks)
    .where(and(
      eq(tasks.userId, userId),
      eq(tasks.status, 'completed'),
    ));

  const allTasks = await db.select().from(tasks)
    .where(eq(tasks.userId, userId));

  const userHabits = await db.select().from(habits)
    .where(eq(habits.userId, userId));

  const recentLogs = await db.select().from(habitLogs)
    .where(gte(habitLogs.date, sevenDaysAgo));

  const result = await generateJSON<ProductivityAnalysis>(
    `Weekly productivity data:
- Total tasks: ${allTasks.length}
- Completed: ${completedTasks.length}
- Completion rate: ${allTasks.length ? Math.round(completedTasks.length / allTasks.length * 100) : 0}%
- Active habits: ${userHabits.length}
- Habit check-ins this week: ${recentLogs.length}
- Tasks by priority: ${JSON.stringify(allTasks.reduce((acc, t) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc; }, {} as Record<string, number>))}
- Tasks by category: ${JSON.stringify(allTasks.reduce((acc, t) => { if (t.category) acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {} as Record<string, number>))}

Provide a comprehensive productivity analysis.

Return JSON: { "score": 72, "summary": "...", "strengths": ["..."], "improvements": ["..."], "tips": ["..."] }`,
    'You are a data-driven productivity analyst. Provide specific, actionable insights based on the data.'
  );

  return result;
}

// ──────────── Tool: Auto-Categorize Task ────────────

export async function categorizeTask(title: string, description?: string): Promise<{
  category: string;
  priority: string;
  estimatedMinutes: number;
}> {
  return generateJSON(
    `Task title: "${title}"
Description: ${description || 'N/A'}

Categorize this task and estimate its effort.

Return JSON: { "category": "work|personal|health|learning|finance", "priority": "low|medium|high|urgent", "estimatedMinutes": 30 }`,
    'You are a task categorization AI. Be accurate and practical.'
  );
}

// ──────────── Tool: Chat with context ────────────

export async function buildChatContext(userId: string): Promise<string> {
  const pendingTasks = await db.select().from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.status, 'pending')))
    .limit(20);

  const activeGoals = await db.select().from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, 'active')))
    .limit(10);

  const userHabits = await db.select().from(habits)
    .where(eq(habits.userId, userId));

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const hour = now.getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return `CURRENT CONTEXT:
- Date/Time: ${now.toISOString()} (${greeting})
- Today: ${today}

USER'S PENDING TASKS (${pendingTasks.length}):
${pendingTasks.map(t => `  - [${t.priority}] "${t.title}" ${t.dueDate ? `(due: ${t.dueDate})` : '(no deadline)'} ${t.category ? `[${t.category}]` : ''}`).join('\n')}

USER'S ACTIVE GOALS (${activeGoals.length}):
${activeGoals.map(g => `  - "${g.title}" (${g.progress}% complete) ${g.deadline ? `(deadline: ${g.deadline})` : ''}`).join('\n')}

USER'S HABITS (${userHabits.length}):
${userHabits.map(h => `  - "${h.title}" (${h.frequency}, streak: ${h.streak} days)`).join('\n')}

You are the user's AI productivity companion. You have full context about their tasks, goals, and habits.
You can help them:
1. Plan and prioritize their day
2. Break down complex tasks
3. Suggest schedule changes
4. Provide motivational support
5. Answer productivity-related questions
6. Create new tasks (suggest they use the task creation form)

Be conversational, empathetic, and action-oriented. Keep responses concise but helpful.`;
}
