"use server";

import { db } from "@/db";
import { goals, goalMilestones } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { decomposeGoal } from "@/lib/ai/agent";

export async function getGoals() {
  const { userId } = await requireAuth();
  return db.select().from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt));
}

export async function createGoal(data: {
  title: string;
  description?: string;
  deadline?: string;
}) {
  const { userId } = await requireAuth();

  await db.insert(goals).values({
    id: uuidv4(),
    userId,
    title: data.title,
    description: data.description || null,
    deadline: data.deadline || null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/goals");
}

export async function updateGoal(goalId: string, data: Partial<{
  title: string;
  description: string;
  deadline: string;
  progress: number;
  status: string;
}>) {
  const { userId } = await requireAuth();

  await db.update(goals)
    .set(data)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/goals");
}

export async function deleteGoal(goalId: string) {
  const { userId } = await requireAuth();
  await db.delete(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/goals");
}

export async function aiDecomposeGoal(goalId: string) {
  await requireAuth();
  const result = await decomposeGoal(goalId);
  revalidatePath("/dashboard/goals");
  return result;
}

export async function getMilestones(goalId: string) {
  return db.select().from(goalMilestones)
    .where(eq(goalMilestones.goalId, goalId));
}

export async function toggleMilestone(milestoneId: string) {
  const result = await db.select().from(goalMilestones)
    .where(eq(goalMilestones.id, milestoneId));
  if (result.length === 0) return;

  const milestone = result[0];
  await db.update(goalMilestones)
    .set({ isCompleted: !milestone.isCompleted })
    .where(eq(goalMilestones.id, milestoneId));

  // Update goal progress
  const allMilestones = await db.select().from(goalMilestones)
    .where(eq(goalMilestones.goalId, milestone.goalId));
  const completed = allMilestones.filter(m =>
    m.id === milestoneId ? !milestone.isCompleted : m.isCompleted
  ).length;
  const progress = Math.round((completed / allMilestones.length) * 100);

  await db.update(goals)
    .set({ progress })
    .where(eq(goals.id, milestone.goalId));

  revalidatePath("/dashboard/goals");
}
