"use server";

import { db } from "@/db";
import { habits, habitLogs } from "@/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function getHabits() {
  const { userId } = await requireAuth();
  return db.select().from(habits)
    .where(eq(habits.userId, userId))
    .orderBy(desc(habits.createdAt));
}

export async function createHabit(data: {
  title: string;
  frequency: string;
  color?: string;
}) {
  const { userId } = await requireAuth();

  await db.insert(habits).values({
    id: uuidv4(),
    userId,
    title: data.title,
    frequency: data.frequency,
    color: data.color || '#8b5cf6',
  });

  revalidatePath("/dashboard/habits");
}

export async function deleteHabit(habitId: string) {
  const { userId } = await requireAuth();
  await db.delete(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)));
  revalidatePath("/dashboard/habits");
}

export async function toggleHabitLog(habitId: string, date: string) {
  // Check if log exists for this date
  const existing = await db.select().from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)));

  if (existing.length > 0) {
    // Remove log (uncheck)
    await db.delete(habitLogs).where(eq(habitLogs.id, existing[0].id));
  } else {
    // Add log (check)
    await db.insert(habitLogs).values({
      id: uuidv4(),
      habitId,
      date,
    });
  }

  // Recalculate streak
  await recalculateStreak(habitId);
  revalidatePath("/dashboard/habits");
}

async function recalculateStreak(habitId: string) {
  const logs = await db.select().from(habitLogs)
    .where(eq(habitLogs.habitId, habitId))
    .orderBy(desc(habitLogs.date));

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    if (logs.some(l => l.date === dateStr)) {
      streak++;
    } else if (i > 0) { // Allow today to be unchecked
      break;
    }
  }

  const habit = await db.select().from(habits).where(eq(habits.id, habitId));
  const bestStreak = Math.max(streak, habit[0]?.bestStreak || 0);

  await db.update(habits)
    .set({ streak, bestStreak })
    .where(eq(habits.id, habitId));
}

export async function getHabitLogs(habitId: string, startDate: string) {
  return db.select().from(habitLogs)
    .where(and(
      eq(habitLogs.habitId, habitId),
      gte(habitLogs.date, startDate),
    ));
}

export async function getAllHabitLogs(startDate: string) {
  const { userId } = await requireAuth();
  const userHabits = await db.select().from(habits)
    .where(eq(habits.userId, userId));
  const habitIds = userHabits.map(h => h.id);

  if (habitIds.length === 0) return [];

  const allLogs = [];
  for (const hid of habitIds) {
    const logs = await db.select().from(habitLogs)
      .where(and(eq(habitLogs.habitId, hid), gte(habitLogs.date, startDate)));
    allLogs.push(...logs);
  }
  return allLogs;
}
