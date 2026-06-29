"use server";

import { db } from "@/db";
import { tasks, subtasks } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { categorizeTask, prioritizeTasks as aiPrioritize } from "@/lib/ai/agent";

export async function getTasks() {
  const { userId } = await requireAuth();
  return db.select().from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt));
}

export async function getTasksByStatus(status: string) {
  const { userId } = await requireAuth();
  return db.select().from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.status, status)));
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: string;
  category?: string;
  dueDate?: string;
  estimatedMinutes?: number;
}) {
  const { userId } = await requireAuth();

  // AI auto-categorize if not provided
  let category = data.category;
  let priority = data.priority || 'medium';
  let estimatedMinutes = data.estimatedMinutes;

  if (!category || !estimatedMinutes) {
    try {
      const aiResult = await categorizeTask(data.title, data.description);
      if (!category) category = aiResult.category;
      if (!data.priority) priority = aiResult.priority;
      if (!estimatedMinutes) estimatedMinutes = aiResult.estimatedMinutes;
    } catch {
      // Fallback if AI fails
      category = category || 'personal';
      estimatedMinutes = estimatedMinutes || 30;
    }
  }

  await db.insert(tasks).values({
    id: uuidv4(),
    userId,
    title: data.title,
    description: data.description || null,
    priority,
    category,
    dueDate: data.dueDate || null,
    estimatedMinutes,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
}

export async function updateTask(taskId: string, data: Partial<{
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  dueDate: string;
  estimatedMinutes: number;
}>) {
  const { userId } = await requireAuth();

  const updates: Record<string, unknown> = { ...data };
  if (data.status === 'completed') {
    updates.completedAt = new Date().toISOString();
  }

  await db.update(tasks)
    .set(updates)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
}

export async function deleteTask(taskId: string) {
  const { userId } = await requireAuth();
  await db.delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
}

export async function toggleTaskStatus(taskId: string) {
  const { userId } = await requireAuth();
  const result = await db.select().from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

  if (result.length === 0) return;

  const task = result[0];
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';

  await db.update(tasks)
    .set({
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
    })
    .where(eq(tasks.id, taskId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
}

export async function runAIPrioritization() {
  const { userId } = await requireAuth();
  const result = await aiPrioritize(userId);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  return result;
}

export async function getSubtasks(taskId: string) {
  return db.select().from(subtasks).where(eq(subtasks.taskId, taskId));
}
