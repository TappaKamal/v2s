import { NextRequest } from 'next/server';
import { streamText } from '@/lib/ai/gemini';
import { buildChatContext } from '@/lib/ai/agent';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { message, history } = await req.json();

  const context = await buildChatContext(session.userId);

  const conversationHistory = (history || [])
    .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const fullPrompt = `${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ''}User: ${message}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamText(fullPrompt, context)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'AI service error' })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
