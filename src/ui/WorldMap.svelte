<script lang="ts">
  import { base } from '$app/paths';
  import { _ } from '$i18n/index.js';
  import { WORLDS } from '$content/worlds.js';
  import { getMissionById } from '$content/missions.js';
  import { progress } from '$lib/stores/progress.svelte.js';

  const t = $derived($_);

  // Each world card lists its missions with earned stars and a lock state, plus its quiz gate:
  // once every mission of a world is passed, a "Take the quiz" CTA appears; passing the quiz shows
  // a score badge and unlocks the next world. A world stays locked until the PRIOR world's quiz
  // is passed (the lock note explains why).
  const worldViews = $derived(
    WORLDS.map((world) => {
      const unlocked = progress.isWorldUnlocked(world.id);
      const missions = world.missionIds
        .map((id) => getMissionById(id))
        .filter((m) => m !== undefined)
        .map((m) => ({
          id: m.id,
          goalKey: m.goalKey,
          stars: progress.starCount(m.id),
          passed: progress.isPassed(m.id)
        }));
      const allMissionsPassed =
        missions.length > 0 && missions.every((m) => m.passed);
      const quizPassed = progress.quizPassed(world.id);
      const quizScore = progress.quizScore(world.id);
      return {
        id: world.id,
        titleKey: world.titleKey,
        unlocked,
        missions,
        allMissionsPassed,
        quizPassed,
        quizScore
      };
    })
  );
</script>

<section class="map" aria-labelledby="map-heading">
  <header class="map-head">
    <h1 id="map-heading">{t('ui.campaign.title')}</h1>
    <p class="subtitle">{t('ui.campaign.subtitle')}</p>
  </header>

  <ul class="world-list">
    {#each worldViews as world (world.id)}
      <li class="world" class:locked={!world.unlocked}>
        <div class="world-head">
          <h2 class="world-title">
            <span class="world-icon" aria-hidden="true">{world.unlocked ? '🏠' : '🔒'}</span>
            {t(world.titleKey)}
          </h2>
          <span class="world-head-right">
            <a class="enc-link" href={`${base}/encyclopedia/${world.id}`}>
              📖 {t('enc.open')}
            </a>
            {#if !world.unlocked}
              <span class="lock-note" title={t('ui.campaign.quizLocked')}>
                {t('ui.campaign.lockedWorld')}
              </span>
            {:else if world.quizPassed}
              <span class="quiz-badge" title={t('ui.campaign.quizScoreBadge')}>
                ✓ {world.quizScore}%
              </span>
            {/if}
          </span>
        </div>

        <ul class="mission-list">
          {#each world.missions as m (m.id)}
            <li class="mission" class:done={m.passed}>
              {#if world.unlocked}
                <a class="mission-link" href={`${base}/mission/${m.id}`}>
                  <span class="mission-state" aria-hidden="true">{m.passed ? '✓' : '▶'}</span>
                  <span class="mission-text">
                    <span class="mission-goal">{t(m.goalKey)}</span>
                    <span
                      class="mission-stars"
                      aria-label={`${m.stars} ${t('ui.campaign.starsOf')}`}
                    >
                      {#each [0, 1, 2] as i (i)}
                        <span aria-hidden="true">{i < m.stars ? '⭐' : '☆'}</span>
                      {/each}
                    </span>
                  </span>
                  <span class="mission-cta">{t('ui.campaign.play')}</span>
                </a>
              {:else}
                <span
                  class="mission-link mission-disabled"
                  aria-disabled="true"
                  title={t('ui.campaign.lockedMission')}
                >
                  <span class="mission-state" aria-hidden="true">🔒</span>
                  <span class="mission-text">
                    <span class="mission-goal">{t(m.goalKey)}</span>
                    <span class="mission-stars" aria-hidden="true">
                      {#each [0, 1, 2] as i (i)}<span>☆</span>{/each}
                    </span>
                  </span>
                  <span class="mission-cta">{t('ui.campaign.lockedMission')}</span>
                </span>
              {/if}
            </li>
          {/each}
        </ul>

        {#if world.unlocked && world.allMissionsPassed && !world.quizPassed}
          <a class="quiz-cta" href={`${base}/quiz/${world.id}`}>
            <span class="quiz-cta-icon" aria-hidden="true">📝</span>
            <span class="quiz-cta-text">{t('ui.campaign.takeQuiz')}</span>
          </a>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .map {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .map-head h1 {
    font-size: 1.6rem;
  }

  .subtitle {
    margin: 0.25rem 0 0;
    color: var(--ink-soft);
  }

  .world-list,
  .mission-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .world-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .world {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 1.1rem 1.25rem;
    box-shadow: var(--shadow-soft);
  }

  .world.locked {
    background: var(--locked);
  }

  .world-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.85rem;
    flex-wrap: wrap;
  }

  .world-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.2rem;
  }

  .world-head-right {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .enc-link {
    color: var(--accent-text);
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
    background: var(--accent-soft);
    border-radius: 999px;
    padding: 0.2rem 0.7rem;
    min-height: var(--touch-min);
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }

  .enc-link:hover {
    text-decoration: underline;
  }

  .lock-note {
    color: var(--ink-soft);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .quiz-badge {
    color: var(--ok-text);
    font-size: 0.85rem;
    font-weight: 700;
    background: var(--ok-soft);
    border: 1px solid #9bd3b0;
    border-radius: 999px;
    padding: 0.15rem 0.6rem;
    white-space: nowrap;
  }

  .quiz-cta {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.85rem;
    text-decoration: none;
    color: var(--accent-ink);
    background: var(--accent-strong);
    border-radius: var(--radius-sm);
    padding: 0.75rem 0.9rem;
    font-weight: 700;
    box-shadow: var(--shadow-soft);
    transition:
      transform 0.1s ease,
      opacity 0.15s ease;
  }

  .quiz-cta:hover {
    transform: translateY(-1px);
  }

  .quiz-cta-icon {
    font-size: 1.2rem;
  }

  .mission-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .mission-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: var(--ink);
    background: var(--surface-soft);
    border: 1.5px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0.7rem 0.85rem;
    transition:
      border-color 0.15s ease,
      transform 0.1s ease;
  }

  a.mission-link:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  .mission.done .mission-link {
    border-color: #bfe6cd;
    background: var(--ok-soft);
  }

  .mission-disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .mission-state {
    font-size: 1.2rem;
    flex-shrink: 0;
    color: var(--accent-text);
  }

  .mission.done .mission-state {
    color: var(--ok-text);
  }

  .mission-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .mission-goal {
    font-weight: 600;
    font-size: 0.95rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .mission-stars {
    font-size: 0.9rem;
    color: var(--star);
    letter-spacing: 0.1em;
  }

  .mission-cta {
    flex-shrink: 0;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--accent-text);
  }

  .mission-disabled .mission-cta {
    color: var(--ink-soft);
  }

  @media (max-width: 560px) {
    .mission-cta {
      display: none;
    }
  }
</style>
