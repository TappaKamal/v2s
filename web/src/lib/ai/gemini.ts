import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Add it to .env.local');
    }
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || 'You are a helpful AI productivity assistant.',
      temperature: 0.7,
    },
  });
  return response.text || '';
}

export async function generateJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || 'You are a helpful AI productivity assistant. Always respond with valid JSON only, no markdown.',
      responseMimeType: 'application/json',
      temperature: 0.5,
    },
  });
  const text = response.text || '{}';
  return JSON.parse(text) as T;
}

export async function* streamText(prompt: string, systemInstruction?: string): AsyncGenerator<string> {
  const client = getGeminiClient();
  const response = await client.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || 'You are a helpful AI productivity assistant.',
      temperature: 0.7,
    },
  });
  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
