import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { askModel } from '$lib/llm/client.js';

// We mock the global fetch so NO real network call is ever made. Each test inspects the exact URL,
// headers, and body the client sent, and feeds back a canned Response.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function lastCall(): [string, RequestInit] {
  const call = fetchMock.mock.calls.at(-1);
  return [call?.[0] as string, call?.[1] as RequestInit];
}

describe('askModel — Anthropic', () => {
  it('posts to the Anthropic endpoint with the right headers and body, and parses content[0].text', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ content: [{ type: 'text', text: 'Hello from Claude.' }] })
    );

    const result = await askModel({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-ant-secret',
      system: 'You are an office assistant.',
      user: 'Greet the customer.'
    });

    expect(result).toEqual({ ok: true, text: 'Hello from Claude.' });

    const [url, init] = lastCall();
    expect(url).toBe(ANTHROPIC_URL);
    expect(init.method).toBe('POST');

    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant-secret');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(headers['content-type']).toBe('application/json');
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true');

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('claude-sonnet-4-5');
    expect(body.max_tokens).toBe(1024);
    expect(body.system).toBe('You are an office assistant.');
    expect(body.messages).toEqual([{ role: 'user', content: 'Greet the customer.' }]);
  });

  it('never places the key in the URL (only in the header)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ content: [{ type: 'text', text: 'ok' }] }));
    await askModel({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-ant-leaky-key',
      system: 's',
      user: 'u'
    });
    const [url] = lastCall();
    expect(url).not.toContain('sk-ant-leaky-key');
    expect(url).toBe(ANTHROPIC_URL);
  });
});

describe('askModel — OpenAI', () => {
  it('posts to the OpenAI endpoint with the right headers and body, and parses choices[0].message.content', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ choices: [{ message: { role: 'assistant', content: 'Hello from GPT.' } }] })
    );

    const result = await askModel({
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'sk-openai-secret',
      system: 'You are an office assistant.',
      user: 'Greet the customer.'
    });

    expect(result).toEqual({ ok: true, text: 'Hello from GPT.' });

    const [url, init] = lastCall();
    expect(url).toBe(OPENAI_URL);
    expect(init.method).toBe('POST');

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk-openai-secret');
    expect(headers['content-type']).toBe('application/json');

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.max_tokens).toBe(1024);
    expect(body.messages).toEqual([
      { role: 'system', content: 'You are an office assistant.' },
      { role: 'user', content: 'Greet the customer.' }
    ]);
  });

  it('never places the key in the URL (only in the Authorization header)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: 'ok' } }] })
    );
    await askModel({
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'sk-openai-leaky',
      system: 's',
      user: 'u'
    });
    const [url] = lastCall();
    expect(url).not.toContain('sk-openai-leaky');
    expect(url).toBe(OPENAI_URL);
  });
});

describe('askModel — error handling (never throws to the UI)', () => {
  it('returns {ok:false} with a friendly bad-key message on HTTP 401', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'unauthorized' }, 401));
    const result = await askModel({
      provider: 'anthropic',
      model: 'm',
      apiKey: 'bad',
      system: 's',
      user: 'u'
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/key/i);
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it('returns {ok:false} with a friendly message on a network throw', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const result = await askModel({
      provider: 'openai',
      model: 'm',
      apiKey: 'k',
      system: 's',
      user: 'u'
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0);
      // The raw error detail is never surfaced.
      expect(result.error).not.toContain('network down');
    }
  });

  it('returns {ok:false} when the response shape is empty/unparseable', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ content: [] }));
    const result = await askModel({
      provider: 'anthropic',
      model: 'm',
      apiKey: 'k',
      system: 's',
      user: 'u'
    });
    expect(result.ok).toBe(false);
  });

  it('uses a supplied translator for localised error text', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 401));
    const result = await askModel({
      provider: 'anthropic',
      model: 'm',
      apiKey: 'bad',
      system: 's',
      user: 'u',
      t: (key: string) => (key === 'byok.error.badKey' ? 'Ключ не принят' : key)
    });
    expect(result).toEqual({ ok: false, error: 'Ключ не принят' });
  });
});
