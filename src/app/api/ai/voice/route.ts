import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai/gemini';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { transcript } = await req.json();

  if (!transcript) {
    return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
  }

  const result = await generateJSON<{
    title: string;
    description: string;
    priority: string;
    category: string;
    dueDate: string | null;
    estimatedMinutes: number;
  }>(
    `The user dictated the following via voice:
"${transcript}"

Extract a task from this voice input. Interpret natural language dates relative to today (${new Date().toISOString().split('T')[0]}).

Return JSON: {
  "title": "concise task title",
  "description": "expanded description if needed",
  "priority": "low|medium|high|urgent",
  "category": "work|personal|health|learning|finance",
  "dueDate": "YYYY-MM-DD or null",
  "estimatedMinutes": 30
}`,
    'You are a voice-to-task AI. Extract structured task data from spoken input. Be smart about interpreting dates like "tomorrow", "next week", "by Friday".'
  );

  return NextResponse.json(result);
}
