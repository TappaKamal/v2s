import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ──────────── Users ────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  timezone: text('timezone').default('Asia/Kolkata'),
  workStartHour: integer('work_start_hour').default(9),
  workEndHour: integer('work_end_hour').default(18),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ──────────── Tasks ────────────
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('pending').notNull(), // pending | in_progress | completed
  priority: text('priority').default('medium').notNull(), // low | medium | high | urgent
  category: text('category'), // work | personal | health | learning | finance
  dueDate: text('due_date'), // ISO string
  scheduledStart: text('scheduled_start'), // ISO string for calendar time-block
  scheduledEnd: text('scheduled_end'),
  estimatedMinutes: integer('estimated_minutes'),
  aiPriorityScore: real('ai_priority_score'), // 0-100 score from AI
  aiSuggestion: text('ai_suggestion'), // AI's reasoning
  isAgentManaged: integer('is_agent_managed', { mode: 'boolean' }).default(false),
  completedAt: text('completed_at'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ──────────── Subtasks ────────────
export const subtasks = sqliteTable('subtasks', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  order: integer('order').default(0),
});

// ──────────── Goals ────────────
export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  deadline: text('deadline'), // ISO string
  progress: integer('progress').default(0), // 0-100
  status: text('status').default('active'), // active | completed | abandoned
  aiDecomposed: integer('ai_decomposed', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ──────────── Goal Milestones ────────────
export const goalMilestones = sqliteTable('goal_milestones', {
  id: text('id').primaryKey(),
  goalId: text('goal_id').references(() => goals.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  order: integer('order').default(0),
});

// ──────────── Habits ────────────
export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  frequency: text('frequency').notNull(), // daily | weekly
  color: text('color').default('#8b5cf6'), // For UI display
  streak: integer('streak').default(0),
  bestStreak: integer('best_streak').default(0),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ──────────── Habit Logs ────────────
export const habitLogs = sqliteTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').references(() => habits.id, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  completed: integer('completed', { mode: 'boolean' }).default(true),
});

// ──────────── AI Insights ────────────
export const aiInsights = sqliteTable('ai_insights', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(), // productivity_tip | schedule_change | rescue_plan | weekly_summary
  content: text('content').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ──────────── Productivity Sessions ────────────
export const productivitySessions = sqliteTable('productivity_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  tasksCompleted: integer('tasks_completed').default(0),
  tasksCreated: integer('tasks_created').default(0),
  focusMinutes: integer('focus_minutes').default(0),
  productivityScore: real('productivity_score'), // AI-generated 0-100
});

// ──────────── Password Reset Tokens ────────────
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(), // ISO string
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});
