import { NextRequest, NextResponse } from 'next/server';
import { analyzeProductivity } from '@/lib/ai/agent';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await analyzeProductivity(session.userId);
  return NextResponse.json(result);
}
