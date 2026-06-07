// BYOK ("bring your own key") config — OPT-IN only. The deterministic campaign/engine never
// touches this. We persist the player's own provider/model/key to THEIR browser's localStorage
// and nowhere else; the key is sent only to the chosen official provider endpoint (see
// src/lib/llm/client.ts). We never read it back to any other host, log, or analytics.
//
// This file is a thin Svelte 5 runes wrapper. All persistence logic lives in the plain (runes-free)
// byok-persistence.ts so it can be unit-tested directly in the node test environment.

import {
  loadConfig,
  saveConfig,
  clearConfig,
  type ByokConfig,
  type Provider
} from './byok-persistence.js';

export type { ByokConfig, Provider };

// Svelte 5 runes store: any component reading these fields re-renders when they change. The key
// lives ONLY here (in the user's browser) and is forgettable via forget().
class ByokState {
  provider = $state<Provider>('anthropic');
  model = $state('');
  apiKey = $state('');

  constructor() {
    const loaded = loadConfig();
    this.provider = loaded.provider;
    this.model = loaded.model;
    this.apiKey = loaded.apiKey;
  }

  /** Replace the whole config and persist it to the user's browser. */
  setConfig(config: ByokConfig): void {
    this.provider = config.provider;
    this.model = config.model;
    this.apiKey = config.apiKey;
    saveConfig(config);
  }

  /** Wipe the key (and the rest of the config) from memory AND localStorage. */
  forget(): void {
    this.provider = 'anthropic';
    this.model = '';
    this.apiKey = '';
    clearConfig();
  }

  /** A snapshot of the current config (provider + model + key). */
  config(): ByokConfig {
    return { provider: this.provider, model: this.model, apiKey: this.apiKey };
  }

  /** Ready to call a real model only when provider, model, and key are all present. */
  get isReady(): boolean {
    return Boolean(this.provider && this.model.trim() && this.apiKey.trim());
  }
}

export const byok = new ByokState();
