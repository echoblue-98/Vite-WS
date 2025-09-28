// Backend-powered adaptive question selection API utility
export async function fetchNextQuestion(params: {
  text?: string;
  sentiment?: string;
  eq_score?: number;
  emotion_scores?: Record<string, number>;
  voice_features?: Record<string, any>;
}): Promise<string> {
  const apiUrl = getApiUrl();
  const res = await fetch(apiUrl + '/next_question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Next Question API error');
  const data = await res.json();
  return data.next_question;
}
// Backend-powered emotion detection API utility
export async function fetchEmotion(text: string): Promise<Record<string, number>> {
  const apiUrl = getApiUrl();
  const res = await fetch(apiUrl + '/emotion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error('Emotion API error');
  const data = await res.json();
  return data.emotion_scores;
}
// Backend-powered feedback API utility
// (Removed duplicate definition)
// src/api.ts
// Clean API utility for backend integration

export function getApiUrl(): string {
  // Prefer Vite env at build/runtime when available, but avoid direct import.meta for Jest
  try {
    const metaEnv = (Function('try { return (typeof import !== "undefined" && import.meta && import.meta.env) ? import.meta.env : undefined } catch { return undefined }'))();
    const viteUrl = (metaEnv && (metaEnv as any).VITE_API_URL) as string | undefined;
    if (viteUrl && viteUrl.length > 0) return viteUrl;
  } catch {}
  // Fallback to Node/Jest env (tests)
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL as string;
  }
  // Sensible default for local
  return 'http://localhost:8000';
}

const API_URL = getApiUrl();

export async function fetchSentiment(inputText: string): Promise<string> {
  const res = await fetch(`${API_URL}/sentiment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: inputText })
  });
  if (!res.ok) throw new Error('Sentiment API error');
  const data = await res.json();
  return data.sentiment;
}

export async function fetchArchetype(eq_score: number): Promise<string> {
  const res = await fetch(`${API_URL}/archetype`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eq_score })
  });
  if (!res.ok) throw new Error('Archetype API error');
  const data = await res.json();
  return data.archetype;
}

export async function fetchFeedback(
  text: string,
  sentiment?: string,
  eq_score?: number,
  emotion_scores?: Record<string, number>,
  voice_features?: Record<string, any>,
  candidate_id?: string
): Promise<string> {
  const apiUrl = getApiUrl();
  const res = await fetch(apiUrl + '/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sentiment, eq_score, emotion_scores, voice_features, candidate_id })
  });
  if (!res.ok) throw new Error('Feedback API error');
  const data = await res.json();
  return data.feedback;
}

export async function fetchEQScore(response: string, inflection: any): Promise<number> {
  const res = await fetch(`${API_URL}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response, inflection })
  });
  if (!res.ok) throw new Error('EQ Score API error');
  const data = await res.json();
  return data.eq_score;
}
