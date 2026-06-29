"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Sparkles, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, type PieLabelRenderProps } from "recharts";
import { getTasks } from "@/app/actions/tasks";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  completedAt: string | null;
  createdAt: string | null;
}

interface AIAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  tips: string[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const categoryColors: Record<string, string> = {
  work: '#3b82f6', personal: '#8b5cf6', health: '#10b981', learning: '#f59e0b', finance: '#ef4444',
};

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    getTasks().then(data => setTasks(data as Task[])).catch(() => {});
  }, []);

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Weekly data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const weeklyData = last7Days.map(date => {
    const created = tasks.filter(t => t.createdAt?.startsWith(date)).length;
    const completed = completedTasks.filter(t => t.completedAt?.startsWith(date)).length;
    return {
      day: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
      created,
      completed,
    };
  });

  // Category data
  const categoryData = Object.entries(
    tasks.reduce((acc, t) => {
      const cat = t.category || 'uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Priority data
  const priorityData = Object.entries(
    tasks.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analytics", { method: "POST" });
      const data = await res.json();
      setAnalysis(data);
    } catch {}
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-base text-muted-foreground">Track your productivity patterns</p>
        </div>
        <Button
          onClick={handleAnalyze}
          variant="outline"
          size="sm"
          disabled={isAnalyzing}
          className="gap-2 rounded-full border-green-500/30 hover:bg-green-500/10 hover:text-green-600"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Analysis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 border-border/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <p className="text-4xl font-bold mt-1">{tasks.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-4xl font-bold mt-1 text-emerald-400">{completedTasks.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-4xl font-bold mt-1 text-orange-400">{pendingTasks.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <p className="text-4xl font-bold mt-1">{completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/30">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Activity</CardTitle>
            <CardDescription className="text-sm">Tasks created vs completed</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="created" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Created" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/30">
          <CardHeader>
            <CardTitle className="text-lg">By Category</CardTitle>
            <CardDescription className="text-sm">Task distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-base">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(props: PieLabelRenderProps) => `${props.name || ''} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              AI Productivity Analysis
              <span className="ml-auto text-3xl font-bold text-green-600">{analysis.score}/100</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base text-foreground/80">{analysis.summary}</p>

            {analysis.strengths.length > 0 && (
              <div>
                <p className="text-sm font-medium text-emerald-400 flex items-center gap-1 mb-2"><TrendingUp className="w-3 h-3" /> Strengths</p>
                <ul className="space-y-1">
                  {analysis.strengths.map((s, i) => <li key={i} className="text-base text-muted-foreground">• {s}</li>)}
                </ul>
              </div>
            )}

            {analysis.improvements.length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-400 flex items-center gap-1 mb-2"><TrendingDown className="w-3 h-3" /> Areas to Improve</p>
                <ul className="space-y-1">
                  {analysis.improvements.map((s, i) => <li key={i} className="text-base text-muted-foreground">• {s}</li>)}
                </ul>
              </div>
            )}

            {analysis.tips.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">💡 Tips</p>
                <ul className="space-y-1">
                  {analysis.tips.map((s, i) => <li key={i} className="text-base text-muted-foreground">• {s}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}



