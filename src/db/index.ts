import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const isTursoEnabled = process.env.TURSO_DATABASE_URL && process.env.TURSO_DATABASE_URL.length > 0;

// Fallback to local SQLite if Turso env vars are not set
// Vercel serverless functions have a read-only filesystem except for /tmp
const isVercel = process.env.VERCEL === '1';
const localDbPath = isVercel 
  ? '/tmp/app.db' 
  : path.join(process.cwd(), 'data', 'app.db');

if (!isTursoEnabled && !isVercel) {
  const dataDir = path.dirname(localDbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${localDbPath}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Auto-create tables on first import
async function initializeDatabase() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      timezone TEXT DEFAULT 'Asia/Kolkata',
      work_start_hour INTEGER DEFAULT 9,
      work_end_hour INTEGER DEFAULT 18,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      category TEXT,
      due_date TEXT,
      scheduled_start TEXT,
      scheduled_end TEXT,
      estimated_minutes INTEGER,
      ai_priority_score REAL,
      ai_suggestion TEXT,
      is_agent_managed INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      "order" INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      deadline TEXT,
      progress INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      ai_decomposed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS goal_milestones (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      "order" INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      frequency TEXT NOT NULL,
      color TEXT DEFAULT '#8b5cf6',
      streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ai_insights (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS productivity_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      tasks_completed INTEGER DEFAULT 0,
      tasks_created INTEGER DEFAULT 0,
      focus_minutes INTEGER DEFAULT 0,
      productivity_score REAL
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `;

  // executeMultiple is required for multiple statements in libsql
  try {
    await client.executeMultiple(sql);
  } catch (error) {
    console.error("Failed to initialize Turso database schema:", error);
  }
}

// Fire and forget initialization
initializeDatabase().catch(console.error);
