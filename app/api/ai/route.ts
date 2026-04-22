// app/api/ai/route.ts
// Server-side AI proxy — keeps API keys out of the browser.
// Supports: Gemini (google), Groq, Mistral

import { NextRequest, NextResponse } from 'next/server';
import type { AIRequest, AIResponse, AIBackend } from '@/lib/types';

// ─── Prompt builders ────────────────────────────────────────────────────────

function buildExpandPrompt(topic: string, parentContext: string | undefined, language: string): string {
  const ctx = parentContext ? ` (in the context of "${parentContext}")` : '';
  if (language === 'pt') {
    return `Liste exatamente 5 sub-conceitos relacionados ao tópico "${topic}"${ctx}. 
Responda APENAS com uma lista JSON de strings curtas (máximo 4 palavras cada).
Exemplo: ["conceito1","conceito2","conceito3","conceito4","conceito5"]
Nenhum texto extra, apenas JSON.`;
  }
  return `List exactly 5 related sub-concepts for the topic "${topic}"${ctx}.
Reply ONLY with a JSON array of short strings (max 4 words each).
Example: ["concept1","concept2","concept3","concept4","concept5"]
No extra text, just JSON.`;
}

function buildSummarizePrompt(topic: string, language: string): string {
  if (language === 'pt') {
    return `Para o tópico "${topic}", responda APENAS com JSON válido neste formato exato:
{
  "summary": "Resumo em 2-3 frases",
  "keyPoints": ["ponto1","ponto2","ponto3","ponto4","ponto5"],
  "questions": ["pergunta1?","pergunta2?","pergunta3?"]
}
Nenhum texto extra, apenas JSON.`;
  }
  return `For the topic "${topic}", reply ONLY with valid JSON in this exact format:
{
  "summary": "A 2-3 sentence summary",
  "keyPoints": ["point1","point2","point3","point4","point5"],
  "questions": ["question1?","question2?","question3?"]
}
No extra text, just JSON.`;
}

// ─── Safe JSON parse from AI text ───────────────────────────────────────────

function safeParseJSON(text: string): unknown {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  return JSON.parse(cleaned);
}

// ─── Backend callers ─────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in environment');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in environment');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 512,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function callMistral(prompt: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY not set in environment');

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 512,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mistral API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function callBackend(backend: AIBackend, prompt: string): Promise<string> {
  switch (backend) {
    case 'gemini':  return callGemini(prompt);
    case 'groq':    return callGroq(prompt);
    case 'mistral': return callMistral(prompt);
    default:        throw new Error(`Unknown backend: ${backend}`);
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<AIResponse>> {
  try {
    const body: AIRequest = await req.json();
    const { action, topic, backend, language, parentContext } = body;

    if (!topic || !action || !backend) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let raw: string;

    if (action === 'expand') {
      const prompt = buildExpandPrompt(topic, parentContext, language);
      raw = await callBackend(backend, prompt);

      const parsed = safeParseJSON(raw) as string[];
      if (!Array.isArray(parsed)) throw new Error('Expected JSON array from AI');

      const concepts = parsed
        .filter((c) => typeof c === 'string' && c.trim().length > 0)
        .slice(0, 5);

      return NextResponse.json({ concepts });

    } else if (action === 'summarize') {
      const prompt = buildSummarizePrompt(topic, language);
      raw = await callBackend(backend, prompt);

      const parsed = safeParseJSON(raw) as {
        summary: string;
        keyPoints: string[];
        questions: string[];
      };

      return NextResponse.json({
        summary: parsed.summary ?? '',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      });

    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[KAI-X API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
