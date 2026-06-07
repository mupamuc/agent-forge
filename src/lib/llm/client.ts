// Provider client for the OPT-IN "real AI" demo. SECURITY: the only network calls this file makes
// are to the two official provider endpoints below. The key comes ONLY from the caller (which reads
// it from the user's localStorage) — it's placed in a HEADER, never in a URL/query string — and it
// is never sent to any other host, log, or analytics. Errors are caught and returned as friendly
// office-language messages; nothing throws to the UI.

import type { Provider } from '$lib/stores/byok-persistence.js';

// The ONLY two endpoints this app is allowed to contact.
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const MAX_TOKENS = 1024;
const ANTHROPIC_VERSION = '2023-06-01';

// A minimal translate signature so error text is RU/EN aware. Optional: when omitted we fall back
// to a plain built-in string so the function still works (and stays testable without i18n).
type Translate = (key: string) => string;

export interface AskModelParams {
  provider: Provider;
  model: string;
  apiKey: string;
  system: string;
  user: string;
  /** Optional translator for friendly, localised error text. */
  t?: Translate;
}

export type AskModelResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

// Built-in fallback strings (used only when no translator is supplied — e.g. in unit tests). Kept
// short and office-friendly; the real UI passes `t` so the user sees the localised i18n version.
const FALLBACK = {
  badKey: 'The key was not accepted — check it in settings.',
  rateOrNetwork: 'Could not reach the service right now — please try again in a moment.',
  empty: 'The service replied, but the answer was empty.'
} as const;

function msg(t: Translate | undefined, key: string, fallback: string): string {
  return t ? t(key) : fallback;
}

/**
 * Ask a real model. Returns {ok:true,text} on success or {ok:false,error} on any failure — it never
 * throws. The key is sent only in the provider's auth header, only to that provider's endpoint.
 */
export async function askModel(params: AskModelParams): Promise<AskModelResult> {
  const { provider, model, apiKey, system, user, t } = params;
  try {
    const response =
      provider === 'anthropic'
        ? await callAnthropic(model, apiKey, system, user)
        : await callOpenAI(model, apiKey, system, user);

    if (!response.ok) {
      // 401/403 → almost always an invalid/blocked key; everything else → a generic friendly line.
      if (response.status === 401 || response.status === 403) {
        return { ok: false, error: msg(t, 'byok.error.badKey', FALLBACK.badKey) };
      }
      return { ok: false, error: msg(t, 'byok.error.rateOrNetwork', FALLBACK.rateOrNetwork) };
    }

    const data: unknown = await response.json();
    const text = provider === 'anthropic' ? parseAnthropic(data) : parseOpenAI(data);
    if (!text) {
      return { ok: false, error: msg(t, 'byok.error.empty', FALLBACK.empty) };
    }
    return { ok: true, text };
  } catch {
    // network error, CORS, JSON parse failure — anything. Never surface raw details to the UI.
    return { ok: false, error: msg(t, 'byok.error.rateOrNetwork', FALLBACK.rateOrNetwork) };
  }
}

function callAnthropic(
  model: string,
  apiKey: string,
  system: string,
  user: string
): Promise<Response> {
  return fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: user }]
    })
  });
}

function callOpenAI(
  model: string,
  apiKey: string,
  system: string,
  user: string
): Promise<Response> {
  return fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });
}

// Pull data.content[0].text out of an Anthropic Messages response, defensively (any shape change
// just yields an empty string, which the caller surfaces as a friendly "empty" message).
function parseAnthropic(data: unknown): string {
  if (typeof data !== 'object' || data === null) return '';
  const content = (data as { content?: unknown }).content;
  if (!Array.isArray(content) || content.length === 0) return '';
  const first = content[0];
  if (typeof first !== 'object' || first === null) return '';
  const text = (first as { text?: unknown }).text;
  return typeof text === 'string' ? text.trim() : '';
}

// Pull data.choices[0].message.content out of an OpenAI chat-completions response, defensively.
function parseOpenAI(data: unknown): string {
  if (typeof data !== 'object' || data === null) return '';
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return '';
  const first = choices[0];
  if (typeof first !== 'object' || first === null) return '';
  const message = (first as { message?: unknown }).message;
  if (typeof message !== 'object' || message === null) return '';
  const content = (message as { content?: unknown }).content;
  return typeof content === 'string' ? content.trim() : '';
}
