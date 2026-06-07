// Pure persistence helpers for the BYOK config. Kept in a plain .ts (no Svelte runes) so it's
// directly unit-testable in the node vitest environment, and so byok.svelte.ts stays a thin runes
// wrapper over this logic. SECURITY: the key lives ONLY in the user's browser localStorage here.

export type Provider = 'anthropic' | 'openai';

export interface ByokConfig {
  provider: Provider;
  model: string;
  apiKey: string;
}

export const STORAGE_KEY = 'agent-forge.byok';

/** Empty config — the default "not configured" state (no provider chosen yet, no key). */
export function emptyConfig(): ByokConfig {
  return { provider: 'anthropic', model: '', apiKey: '' };
}

// Structural guard so corrupt/foreign storage degrades to empty WITHOUT throwing.
export function isByokConfig(value: unknown): value is ByokConfig {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.provider === 'anthropic' || v.provider === 'openai') &&
    typeof v.model === 'string' &&
    typeof v.apiKey === 'string'
  );
}

/**
 * Load the saved config from localStorage. Missing, malformed, or structurally-wrong storage
 * degrades to an empty config WITHOUT throwing (same defensive pattern as persistence.ts).
 */
export function loadConfig(): ByokConfig {
  if (typeof localStorage === 'undefined') return emptyConfig();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return emptyConfig();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isByokConfig(parsed)) return parsed;
  } catch {
    // malformed JSON — fall through to an empty config
  }
  return emptyConfig();
}

/** Persist the config. Silently no-ops when storage is unavailable (private mode, SSR, quota). */
export function saveConfig(config: ByokConfig): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // storage full or blocked — the config simply isn't persisted this run
  }
}

/** Delete the saved config (key included) from localStorage. No-op / no-throw if unavailable. */
export function clearConfig(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage blocked — nothing more we can do
  }
}
