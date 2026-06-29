import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Flame, Clock, CheckCircle2, AlertTriangle, TrendingUp, Plus } from "lucide-react";
import { db } from "@/db";
import { tasks, goals, habits, aiInsights } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const userId = session.userId;
  const user = session.user;

  // Fetch data
  const allTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
  const pendingTasks = allTasks.filter(t => t.status === 'pending');
  const completedTasks = allTasks.filter(t => t.status === 'completed');
  const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());

  const activeGoals = await db.select().from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, 'active')));

  const userHabits = await db.select().from(habits)
    .where(eq(habits.userId, userId));

  const latestInsights = await db.select().from(aiInsights)
    .where(eq(aiInsights.userId, userId))
    .orderBy(desc(aiInsights.createdAt))
    .limit(3);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const totalTasks = allTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const topStreak = userHabits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  // Sort pending by AI score or due date
  const upNextTasks = [...pendingTasks]
    .sort((a, b) => {
      if (a.aiPriorityScore && b.aiPriorityScore) return b.aiPriorityScore - a.aiPriorityScore;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
    })
    .slice(0, 5);

  const priorityColors: Record<string, string> = {
    urgent: "bg-red-500/15 text-red-400 border-red-500/20",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    medium: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    low: "bg-green-500/15 text-green-400 border-green-500/20",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{greeting}, {user.name}!</h1>
          <p className="text-muted-foreground text-sm">Here&apos;s what your AI companion has planned for you today.</p>
        </div>
        <Link href="/dashboard/tasks" className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">
          <Plus className="w-4 h-4" /> New Task
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Tasks Done</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}<span className="text-muted-foreground text-lg">/{totalTasks}</span></div>
            <Progress value={completionRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Best Streak</CardTitle>
            <Flame className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topStreak} <span className="text-sm text-muted-foreground">days</span></div>
            <p className="text-xs text-muted-foreground mt-1">{userHabits.length} active habits</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Overdue</CardTitle>
            <AlertTriangle className={`w-4 h-4 ${overdueTasks.length > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueTasks.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {overdueTasks.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdueTasks.length > 0 ? 'Need attention!' : 'All clear ✓'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Goals</CardTitle>
            <TrendingUp className="w-4 h-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeGoals.length > 0 ? `Avg ${Math.round(activeGoals.reduce((s, g) => s + (g.progress || 0), 0) / activeGoals.length)}% progress` : 'Set a goal →'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insight Banner */}
      {latestInsights.length > 0 && (
        <Card className="bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent border-violet-500/20">
          <CardContent className="flex items-start gap-3 py-4">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2 rounded-xl shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-violet-300 mb-1">AI Insight</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{latestInsights[0].content}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Up Next */}
        <Card className="border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Up Next</CardTitle>
            <CardDescription className="text-xs">AI-prioritized tasks for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upNextTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                No pending tasks. <Link href="/dashboard/tasks" className="text-violet-400 hover:underline">Create one</Link>
              </div>
            ) : (
              upNextTasks.map(task => (
                <div key={task.id} className="flex items-start justify-between p-3 rounded-xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex gap-3 min-w-0">
                    <div className="mt-1 shrink-0">
                      <div className="w-4 h-4 rounded-full border-2 border-violet-500/40" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm truncate">{task.title}</h4>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${priorityColors[task.priority] || ''}`}>
                    {task.priority}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active Goals */}
        <Card className="border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Active Goals</CardTitle>
            <CardDescription className="text-xs">Progress on your objectives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {activeGoals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-violet-500/50" />
                No active goals. <Link href="/dashboard/goals" className="text-violet-400 hover:underline">Set one</Link>
              </div>
            ) : (
              activeGoals.slice(0, 4).map(goal => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate mr-2">{goal.title}</span>
                    <span className="text-muted-foreground text-xs shrink-0">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress || 0} className="h-1.5" />
                  {goal.deadline && (
                    <p className="text-xs text-muted-foreground">
                      Deadline: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
