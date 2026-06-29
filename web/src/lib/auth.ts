import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const SESSION_COOKIE = 'session_token';
const SECRET = process.env.GEMINI_API_KEY || 'local_secret_key_v2s';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function signSession(userId: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `${userId}|${expiresAt}`;
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}|${signature}`;
}

function verifySession(token: string): { userId: string } | null {
  try {
    const [userId, expiresAt, signature] = token.split('|');
    if (!userId || !expiresAt || !signature) return null;
    
    if (parseInt(expiresAt, 10) < Date.now()) return null;

    const expectedSignature = crypto.createHmac('sha256', SECRET).update(`${userId}|${expiresAt}`).digest('hex');
    if (signature === expectedSignature) {
      return { userId };
    }
  } catch (e) {
    return null;
  }
  return null;
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

  const sessionToken = signSession(userId);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
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

  const sessionToken = signSession(user.id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
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
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ userId: string; user: typeof users.$inferSelect } | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const validSession = verifySession(sessionToken);
  if (!validSession) return null;

  const result = await db.select().from(users).where(eq(users.id, validSession.userId));
  if (result.length === 0) return null;

  return { userId: validSession.userId, user: result[0] };
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}
