<script lang="ts">
  import type { RenderedLine } from '$lib/trace-render.js';

  interface Props {
    line: RenderedLine;
    index: number;
  }

  let { line, index }: Props = $props();
</script>

<li
  class="step-line"
  class:fail={!line.ok}
  style={`--i: ${index}`}
>
  <span class="marker" aria-hidden="true">{line.marker}</span>
  <span class="text">{line.text}</span>
</li>

<style>
  .step-line {
    display: flex;
    gap: 0.65rem;
    align-items: flex-start;
    background: var(--surface-soft);
    border-radius: var(--radius-sm);
    padding: 0.65rem 0.8rem;
    animation: fade-in 0.28s ease both;
    animation-delay: calc(var(--i) * 0.08s);
  }

  .step-line.fail {
    background: var(--warn-soft);
  }

  .marker {
    font-size: 1.2rem;
    line-height: 1.4;
    flex-shrink: 0;
  }

  .text {
    font-size: 0.95rem;
    line-height: 1.45;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
