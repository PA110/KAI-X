// lib/ai.ts
// Client-side helpers that call our internal Next.js API route
// All actual AI SDK calls happen server-side to protect API keys.

import type { AIBackend, Language, AIResponse, AIRequest } from './types';

/** Call the /api/ai route with a given request payload */
async function callAIRoute(payload: AIRequest): Promise<AIResponse> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/** Expand a topic into 5 related sub-concepts */
export async function expandTopic(
  topic: string,
  parentContext: string | undefined,
  backend: AIBackend,
  language: Language
): Promise<string[]> {
  const data = await callAIRoute({
    action: 'expand',
    topic,
    backend,
    language,
    parentContext,
  });

  if (data.error) throw new Error(data.error);
  return data.concepts ?? [];
}

/** Summarize a topic for Knowledge mode */
export async function summarizeTopic(
  topic: string,
  backend: AIBackend,
  language: Language
): Promise<{ summary: string; keyPoints: string[]; questions: string[] }> {
  const data = await callAIRoute({
    action: 'summarize',
    topic,
    backend,
    language,
  });

  if (data.error) throw new Error(data.error);
  return {
    summary: data.summary ?? '',
    keyPoints: data.keyPoints ?? [],
    questions: data.questions ?? [],
  };
}

/** Detect browser language and return 'pt' or 'en' */
export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const lang = navigator.language?.toLowerCase() ?? 'en';
  return lang.startsWith('pt') ? 'pt' : 'en';
}
