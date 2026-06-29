import { NextRequest, NextResponse } from 'next/server';
import { generateSchedule } from '@/lib/ai/agent';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { date } = await req.json();
  const result = await generateSchedule(session.userId, date);
  return NextResponse.json(result);
}
