import { cookies } from 'next/headers';
import { db } from '@/db';
import { users, passwordResetTokens } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

export async function requestPasswordReset(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  if (result.length === 0) {
    // Return true even if not found to prevent email enumeration
    return { success: true };
  }
  
  const user = result[0];
  // Generate a 6-digit OTP
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins for OTP
  
  // Clear any existing tokens for this user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
  
  await db.insert(passwordResetTokens).values({
    id: uuidv4(),
    userId: user.id,
    token,
    expiresAt,
  });
  
  return { success: true, token }; // For demo purposes, we return the token
}

export async function verifyOtp(email: string, otp: string) {
  const userResult = await db.select().from(users).where(eq(users.email, email));
  if (userResult.length === 0) return { error: 'Invalid or expired OTP' };
  
  const user = userResult[0];
  const tokenResult = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.userId, user.id), eq(passwordResetTokens.token, otp)));
  
  if (tokenResult.length === 0) {
    return { error: 'Invalid or expired OTP' };
  }
  
  const resetData = tokenResult[0];
  if (new Date(resetData.expiresAt) < new Date()) {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetData.id));
    return { error: 'OTP has expired' };
  }
  
  return { success: true };
}

export async function verifyAndResetPassword(email: string, otp: string, newPassword: string) {
  const userResult = await db.select().from(users).where(eq(users.email, email));
  if (userResult.length === 0) return { error: 'Invalid request' };
  
  const user = userResult[0];
  const tokenResult = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.userId, user.id), eq(passwordResetTokens.token, otp)));
  
  if (tokenResult.length === 0) {
    return { error: 'Invalid or expired OTP' };
  }
  
  const resetData = tokenResult[0];
  if (new Date(resetData.expiresAt) < new Date()) {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetData.id));
    return { error: 'OTP has expired' };
  }
  
  const passwordHash = hashPassword(newPassword);
  
  await db.update(users).set({ passwordHash }).where(eq(users.id, resetData.userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id)); // Clean all tokens for safety
  
  // Log them in immediately after reset
  const sessionToken = signSession(resetData.userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
  
  return { success: true };
}
