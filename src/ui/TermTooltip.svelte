<script lang="ts" module>
  // Module-level counter -> stable, unique aria id per instance (deterministic, SSR-safe).
  let seq = 0;
</script>

<script lang="ts">
  import { _ } from '$i18n/index.js';

  interface Props {
    termKey: string;
  }

  let { termKey }: Props = $props();

  const t = $derived($_);
  let open = $state(false);
  let trigger = $state<HTMLButtonElement | null>(null);
  const id = `term-tip-${(seq += 1)}`;

  function toggle(): void {
    open = !open;
  }

  // Escape closes the popover and returns focus to the trigger (WCAG 2.2 — 2.1.2 / focus order).
  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && open) {
      open = false;
      event.stopPropagation();
      trigger?.focus();
    }
  }
</script>

<span class="term-wrap">
  <button
    type="button"
    class="term-trigger"
    bind:this={trigger}
    onclick={(e) => {
      e.stopPropagation();
      toggle();
    }}
    onkeydown={onKeydown}
    aria-label={t('ui.whatIsThis')}
    aria-expanded={open}
    aria-describedby={open ? id : undefined}
  >
    <span class="term-glyph" aria-hidden="true">?</span>
  </button>
  {#if open}
    <span class="term-bubble" role="tooltip" {id}>
      <strong class="term-name">{t(`${termKey}.term`)}</strong>
      <span class="term-explain">{t(`${termKey}.explain`)}</span>
    </span>
  {/if}
</span>

<style>
  .term-wrap {
    position: relative;
    display: inline-flex;
  }

  .term-trigger {
    position: relative;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink-soft);
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  /* Invisible 44px hit area centred on the small "?" glyph so it's easy to tap on touch
     screens (WCAG 2.2 — 2.5.8) without enlarging the visual badge inside the card. */
  .term-trigger::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--touch-min);
    height: var(--touch-min);
    transform: translate(-50%, -50%);
  }

  .term-trigger:hover,
  .term-trigger[aria-expanded='true'] {
    border-color: var(--accent);
    color: var(--accent-text);
  }

  /* Anchor the bubble's right edge to the trigger (which sits near the card's right edge) so it
     never spills off the right of the viewport on narrow screens; cap width to fit a phone. */
  .term-bubble {
    position: absolute;
    top: calc(100% + 0.4rem);
    right: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: max-content;
    max-width: min(260px, 80vw);
    background: var(--ink);
    color: #fff;
    font-size: 0.8rem;
    font-weight: 400;
    line-height: 1.4;
    padding: 0.5rem 0.65rem;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow);
    text-align: left;
  }

  .term-name {
    font-weight: 700;
  }

  .term-explain {
    font-weight: 400;
    opacity: 0.92;
  }
</style>
