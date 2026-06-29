import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const SESSION_COOKIE = 'session_id';
const sessions = new Map<string, { userId: string; expiresAt: number }>();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function signUp(email: string, password: string, name: string) {
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return { error: 'Email already exists' };
  }

  const userId = uuidv4();
  const passwordHash = hashPassword(password);

  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
  });

  const sessionId = uuidv4();
  sessions.set(sessionId, { userId, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return { success: true, userId };
}

export async function signIn(email: string, password: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  if (result.length === 0) {
    return { error: 'Invalid credentials' };
  }

  const user = result[0];
  const passwordHash = hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    return { error: 'Invalid credentials' };
  }

  const sessionId = uuidv4();
  sessions.set(sessionId, { userId: user.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return { success: true, userId: user.id };
}

export async function signOut() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    sessions.delete(sessionId);
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getSession(): Promise<{ userId: string; user: typeof users.$inferSelect } | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(sessionId);
    return null;
  }

  const result = await db.select().from(users).where(eq(users.id, session.userId));
  if (result.length === 0) return null;

  return { userId: session.userId, user: result[0] };
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}
