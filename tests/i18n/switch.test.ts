import { describe, expect, it, beforeAll } from 'vitest';
import { get } from 'svelte/store';
import { init, addMessages, locale, _, waitLocale } from 'svelte-i18n';
import ru from '../../src/i18n/locales/ru.json';
import en from '../../src/i18n/locales/en.json';

// Isolates the i18n switching logic from Svelte component reactivity:
// proves that with both dictionaries added eagerly, locale.set re-resolves strings.
describe('i18n runtime switch (store level)', () => {
  beforeAll(async () => {
    addMessages('ru', ru);
    addMessages('en', en);
    init({ fallbackLocale: 'ru', initialLocale: 'ru' });
    await waitLocale();
  });

  it('resolves RU strings under locale "ru"', async () => {
    locale.set('ru');
    await waitLocale();
    expect(get(_)('ui.run')).toBe('Запустить');
  });

  it('switches to EN strings when locale.set("en")', async () => {
    locale.set('en');
    await waitLocale();
    expect(get(_)('ui.run')).toBe('Run');
    expect(get(_)('ui.missionLabel')).toBe('Task');
  });

  it('switches back to RU', async () => {
    locale.set('ru');
    await waitLocale();
    expect(get(_)('ui.run')).toBe('Запустить');
  });
});
