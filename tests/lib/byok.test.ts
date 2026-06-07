import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadConfig,
  saveConfig,
  clearConfig,
  emptyConfig,
  STORAGE_KEY,
  type ByokConfig
} from '$lib/stores/byok-persistence.js';

// The BYOK config persists ONLY to the user's browser localStorage. vitest runs in node, so we stub
// localStorage with a simple in-memory implementation (mirrors the persistence-test pattern).
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = new MemoryStorage() as unknown as Storage;
});

describe('byok persistence — save/load/forget round-trip', () => {
  it('round-trips a config through localStorage', () => {
    const config: ByokConfig = { provider: 'anthropic', model: 'claude-sonnet-4-5', apiKey: 'sk-test-123' };
    saveConfig(config);
    expect(loadConfig()).toEqual(config);
  });

  it('round-trips an OpenAI config too', () => {
    const config: ByokConfig = { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-openai-xyz' };
    saveConfig(config);
    expect(loadConfig()).toEqual(config);
  });

  it('returns an empty config when storage is empty', () => {
    expect(loadConfig()).toEqual(emptyConfig());
  });

  it('forget (clearConfig) removes the stored key, so load returns empty', () => {
    saveConfig({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-secret' });
    expect(loadConfig().apiKey).toBe('sk-secret');
    clearConfig();
    expect(loadConfig()).toEqual(emptyConfig());
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('byok persistence — corrupt/foreign storage degrades cleanly (no throw)', () => {
  it('returns an empty config for malformed JSON, without throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{ not valid json :::');
    let result: ByokConfig | undefined;
    expect(() => {
      result = loadConfig();
    }).not.toThrow();
    expect(result).toEqual(emptyConfig());
  });

  it('returns an empty config for a structurally-wrong (but valid JSON) object', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider: 'google', model: 5, apiKey: true }));
    expect(loadConfig()).toEqual(emptyConfig());
  });

  it('returns an empty config when the provider is not one of the two allowed values', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider: 'cohere', model: 'm', apiKey: 'k' }));
    expect(loadConfig()).toEqual(emptyConfig());
  });

  it('does not throw when localStorage is unavailable (SSR / private mode)', () => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
    expect(() => loadConfig()).not.toThrow();
    expect(loadConfig()).toEqual(emptyConfig());
    expect(() => saveConfig(emptyConfig())).not.toThrow();
    expect(() => clearConfig()).not.toThrow();
  });
});
