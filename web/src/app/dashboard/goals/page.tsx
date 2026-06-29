"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Target, Sparkles, Trash2, CheckCircle2, Circle, Calendar } from "lucide-react";
import { getGoals, createGoal, deleteGoal, aiDecomposeGoal, getMilestones, toggleMilestone } from "@/app/actions/goals";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  progress: number | null;
  status: string | null;
  aiDecomposed: boolean | null;
}

interface Milestone {
  id: string;
  title: string;
  isCompleted: boolean | null;
  order: number | null;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [decomposingGoalId, setDecomposingGoalId] = useState<string | null>(null);

  const loadGoals = async () => {
    try {
      const data = await getGoals();
      setGoals(data as Goal[]);
    } catch {}
  };

  useEffect(() => { loadGoals(); }, []);

  const loadMilestones = async (goalId: string) => {
    const data = await getMilestones(goalId);
    setMilestones(prev => ({ ...prev, [goalId]: data as Milestone[] }));
  };

  const handleCreate = async (formData: FormData) => {
    const title = formData.get("title") as string;
    if (!title) return;
    startTransition(async () => {
      await createGoal({
        title,
        description: (formData.get("description") as string) || undefined,
        deadline: (formData.get("deadline") as string) || undefined,
      });
      setShowForm(false);
      await loadGoals();
    });
  };

  const handleDecompose = async (goalId: string) => {
    setDecomposingGoalId(goalId);
    try {
      await aiDecomposeGoal(goalId);
      await loadGoals();
      await loadMilestones(goalId);
      setExpandedGoal(goalId);
    } catch {}
    setDecomposingGoalId(null);
  };

  const handleToggleMilestone = async (milestoneId: string, goalId: string) => {
    startTransition(async () => {
      await toggleMilestone(milestoneId);
      await loadMilestones(goalId);
      await loadGoals();
    });
  };

  const handleExpand = async (goalId: string) => {
    if (expandedGoal === goalId) {
      setExpandedGoal(null);
    } else {
      setExpandedGoal(goalId);
      if (!milestones[goalId]) {
        await loadMilestones(goalId);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
          <p className="text-sm text-muted-foreground">{goals.filter(g => g.status === 'active').length} active goals</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
          <Plus className="w-4 h-4" /> New Goal
        </Button>
      </div>

      {showForm && (
        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardContent className="pt-6">
            <form action={handleCreate} className="space-y-3">
              <input name="title" placeholder="What do you want to achieve?" required className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50" autoFocus />
              <textarea name="description" placeholder="Describe your goal (optional)" rows={2} className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none" />
              <div className="flex gap-3 items-center">
                <input name="deadline" type="date" className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                <div className="flex-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isPending} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">Create Goal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 text-violet-500/30" />
            <p className="font-medium">No goals yet</p>
            <p className="text-sm mt-1">Set your first goal and let AI break it down!</p>
          </div>
        ) : (
          goals.map(goal => (
            <Card key={goal.id} className="border-border/30 hover:border-border/50 transition-colors">
              <CardHeader className="pb-3 cursor-pointer" onClick={() => handleExpand(goal.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4 text-violet-500" />
                      {goal.title}
                    </CardTitle>
                    {goal.description && <CardDescription className="mt-1 text-xs">{goal.description}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!goal.aiDecomposed && (
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleDecompose(goal.id); }}
                        variant="outline"
                        size="sm"
                        disabled={decomposingGoalId === goal.id}
                        className="gap-1 text-xs rounded-full border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-400"
                      >
                        <Sparkles className="w-3 h-3" />
                        {decomposingGoalId === goal.id ? "Breaking down..." : "AI Breakdown"}
                      </Button>
                    )}
                    <Button
                      onClick={(e) => { e.stopPropagation(); startTransition(() => deleteGoal(goal.id).then(loadGoals)); }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{goal.progress || 0}%</span>
                  </div>
                  <Progress value={goal.progress || 0} className="h-2" />
                  {goal.deadline && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      Deadline: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </CardHeader>

              {expandedGoal === goal.id && milestones[goal.id] && (
                <CardContent className="pt-0">
                  <div className="border-t border-border/30 pt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Milestones</p>
                    {milestones[goal.id].length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No milestones yet. Click &quot;AI Breakdown&quot; to generate them.</p>
                    ) : (
                      milestones[goal.id]
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(m => (
                          <button
                            key={m.id}
                            onClick={() => handleToggleMilestone(m.id, goal.id)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                          >
                            {m.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <span className={`text-sm ${m.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                              {m.title}
                            </span>
                          </button>
                        ))
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
