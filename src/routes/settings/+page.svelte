<script lang="ts">
  import { base } from '$app/paths';
  import { _ } from '$i18n/index.js';
  import { byok, type Provider } from '$lib/stores/byok.svelte.js';
  import TermTooltip from '../../ui/TermTooltip.svelte';

  const t = $derived($_);

  // Local draft so the player can type freely; we only commit to localStorage on Save. The key
  // input is type=password and never rendered back as text. Seed the draft from whatever is stored.
  let provider = $state<Provider>(byok.provider);
  let model = $state(byok.model);
  let apiKey = $state(byok.apiKey);

  // A small status line after Save / Forget. Cleared whenever the player edits a field.
  let status = $state<'saved' | 'forgotten' | null>(null);

  const modelPlaceholder = $derived(
    provider === 'anthropic'
      ? t('byok.settings.modelPlaceholderAnthropic')
      : t('byok.settings.modelPlaceholderOpenai')
  );

  function onEdit(): void {
    status = null;
  }

  function save(): void {
    byok.setConfig({ provider, model, apiKey });
    status = 'saved';
  }

  function forget(): void {
    byok.forget();
    provider = byok.provider;
    model = byok.model;
    apiKey = byok.apiKey;
    status = 'forgotten';
  }
</script>

<div class="page">
  <a class="back-link" href="{base}/">← {t('ui.backToHome')}</a>

  <header class="page-head">
    <h1>
      {t('byok.settings.title')}
      <TermTooltip termKey="term.byok" />
    </h1>
    <p class="subtitle">{t('byok.settings.subtitle')}</p>
  </header>

  <section class="card" aria-labelledby="byok-form-heading">
    <h2 id="byok-form-heading" class="visually-hidden">{t('byok.settings.title')}</h2>

    <div class="field">
      <label class="field-label" for="byok-provider">{t('byok.settings.providerLabel')}</label>
      <select id="byok-provider" class="control" bind:value={provider} onchange={onEdit}>
        <option value="anthropic">{t('byok.settings.providerAnthropic')}</option>
        <option value="openai">{t('byok.settings.providerOpenai')}</option>
      </select>
    </div>

    <div class="field">
      <label class="field-label" for="byok-model">{t('byok.settings.modelLabel')}</label>
      <p class="hint" id="byok-model-hint">{t('byok.settings.modelHint')}</p>
      <input
        id="byok-model"
        class="control"
        type="text"
        bind:value={model}
        oninput={onEdit}
        placeholder={modelPlaceholder}
        aria-describedby="byok-model-hint"
        autocomplete="off"
      />
    </div>

    <div class="field">
      <label class="field-label" for="byok-key">{t('byok.settings.keyLabel')}</label>
      <p class="hint" id="byok-key-hint">{t('byok.settings.keyHint')}</p>
      <input
        id="byok-key"
        class="control"
        type="password"
        bind:value={apiKey}
        oninput={onEdit}
        placeholder={t('byok.settings.keyPlaceholder')}
        aria-describedby="byok-key-hint"
        autocomplete="off"
      />
    </div>

    <div class="actions">
      <button type="button" class="btn btn-primary" onclick={save}>
        {t('byok.settings.save')}
      </button>
      <button type="button" class="btn btn-ghost" onclick={forget}>
        {t('byok.settings.forget')}
      </button>
    </div>

    {#if status}
      <p class="status" role="status">
        {status === 'saved' ? t('byok.settings.saved') : t('byok.settings.forgotten')}
      </p>
    {/if}

    <p class="readiness" aria-live="polite">
      {byok.isReady ? t('byok.settings.ready') : t('byok.settings.notReady')}
    </p>

    <p class="notice">{t('byok.settings.notice')}</p>
  </section>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 640px;
  }

  .back-link {
    align-self: flex-start;
    color: var(--ink-soft);
    font-weight: 600;
    text-decoration: none;
  }

  .back-link:hover {
    color: var(--accent-text);
  }

  .page-head h1 {
    font-size: 1.6rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .subtitle {
    margin: 0.4rem 0 0;
    color: var(--ink-soft);
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 1.25rem 1.4rem;
    box-shadow: var(--shadow-soft);
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .field-label {
    font-weight: 700;
    font-size: 0.95rem;
  }

  .hint {
    margin: 0;
    color: var(--ink-soft);
    font-size: 0.85rem;
  }

  .control {
    width: 100%;
    background: var(--surface);
    color: var(--ink);
    border: 1.5px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0.6rem 0.7rem;
    font-size: 0.95rem;
    font-weight: 600;
    min-height: var(--touch-min);
  }

  .control:focus {
    border-color: var(--accent);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .btn {
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
    font-weight: 700;
    min-height: var(--touch-min);
  }

  .btn-primary {
    background: var(--accent-strong);
    color: var(--accent-ink);
    box-shadow: var(--shadow);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
  }

  .btn-ghost {
    background: var(--surface-soft);
    color: var(--warn-text);
    border: 1.5px solid var(--line);
  }

  .btn-ghost:hover {
    border-color: var(--warn);
  }

  .status {
    margin: 0;
    color: var(--ok-text);
    font-weight: 600;
    font-size: 0.9rem;
  }

  .readiness {
    margin: 0;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }

  .notice {
    margin: 0;
    background: var(--surface-soft);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0.7rem 0.85rem;
    color: var(--ink-soft);
    font-size: 0.85rem;
    line-height: 1.5;
  }
</style>
