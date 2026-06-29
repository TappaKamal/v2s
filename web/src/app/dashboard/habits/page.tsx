"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Repeat, Trash2, Flame, Check } from "lucide-react";
import { getHabits, createHabit, deleteHabit, toggleHabitLog, getAllHabitLogs } from "@/app/actions/habits";

interface Habit {
  id: string;
  title: string;
  frequency: string;
  color: string | null;
  streak: number | null;
  bestStreak: number | null;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<{ habitId: string; date: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isPending, startTransition] = useTransition();

  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const loadData = async () => {
    try {
      const h = await getHabits();
      setHabits(h as Habit[]);
      const startDate = last7Days[0];
      const l = await getAllHabitLogs(startDate);
      setLogs(l.map(log => ({ habitId: log.habitId, date: log.date })));
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (formData: FormData) => {
    const title = formData.get("title") as string;
    if (!title) return;
    startTransition(async () => {
      await createHabit({
        title,
        frequency: (formData.get("frequency") as string) || "daily",
        color: selectedColor,
      });
      setShowForm(false);
      await loadData();
    });
  };

  const handleToggle = (habitId: string, date: string) => {
    startTransition(async () => {
      await toggleHabitLog(habitId, date);
      await loadData();
    });
  };

  const isChecked = (habitId: string, date: string) =>
    logs.some(l => l.habitId === habitId && l.date === date);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
          <p className="text-sm text-muted-foreground">Build consistency with daily tracking</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2 rounded-full bg-gradient-to-r from-green-600 to-teal-600 text-white">
          <Plus className="w-4 h-4" /> New Habit
        </Button>
      </div>

      {showForm && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <form action={handleCreate} className="space-y-3">
              <input name="title" placeholder="e.g., Meditate for 10 minutes" required className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50" autoFocus />
              <div className="flex gap-3 items-center flex-wrap">
                <select name="frequency" className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
                <div className="flex gap-1.5">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setSelectedColor(c)}
                      className={`w-6 h-6 rounded-full transition-all ${selectedColor === c ? 'ring-2 ring-offset-2 ring-offset-background' : ''}`}
                      style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties} />
                  ))}
                </div>
                <div className="flex-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isPending} className="bg-gradient-to-r from-green-600 to-teal-600 text-white">Create</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {habits.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Repeat className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
          <p className="font-medium">No habits yet</p>
          <p className="text-sm mt-1">Start building consistent habits!</p>
        </div>
      ) : (
        <Card className="border-border/30">
          <CardContent className="pt-6">
            {/* Header: Day labels */}
            <div className="grid grid-cols-[1fr_repeat(7,40px)_60px] gap-2 items-center mb-3">
              <div className="text-xs font-medium text-muted-foreground">Habit</div>
              {last7Days.map(date => (
                <div key={date} className="text-center text-xs text-muted-foreground">
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                </div>
              ))}
              <div className="text-xs font-medium text-muted-foreground text-center">Streak</div>
            </div>

            {/* Habit rows */}
            {habits.map(habit => (
              <div key={habit.id} className="grid grid-cols-[1fr_repeat(7,40px)_60px] gap-2 items-center py-2 border-t border-border/20 group">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: habit.color || '#8b5cf6' }} />
                  <span className="text-sm font-medium truncate">{habit.title}</span>
                  <button
                    onClick={() => startTransition(() => deleteHabit(habit.id).then(loadData))}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
                {last7Days.map(date => {
                  const checked = isChecked(habit.id, date);
                  return (
                    <button
                      key={date}
                      onClick={() => handleToggle(habit.id, date)}
                      className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center transition-all ${
                        checked
                          ? 'text-white shadow-sm'
                          : 'bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                      }`}
                      style={checked ? { backgroundColor: habit.color || '#8b5cf6' } : {}}
                    >
                      {checked && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
                <div className="text-center flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-sm font-semibold">{habit.streak || 0}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

