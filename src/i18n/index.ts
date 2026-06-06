import { init, addMessages, locale, _, isLoading, getLocaleFromNavigator } from 'svelte-i18n';
import ru from './locales/ru.json';
import en from './locales/en.json';

export type Locale = 'ru' | 'en';

const STORAGE_KEY = 'agent-forge.locale';

// Synchronous dictionaries — add them eagerly so BOTH locales are always present in the
// dictionary. This makes runtime RU<->EN switching instant (no async loader, no fallback flash)
// and is what AC-11 needs: locale.set() re-renders strings without re-running the engine.
addMessages('ru', ru);
addMessages('en', en);

function initialLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ru' || stored === 'en') return stored;
  }
  const nav = getLocaleFromNavigator();
  return nav && nav.toLowerCase().startsWith('en') ? 'en' : 'ru';
}

let started = false;

export function setupI18n(): void {
  if (started) return;
  started = true;
  init({
    fallbackLocale: 'ru',
    initialLocale: initialLocale()
  });
}

export function setLocale(next: Locale): void {
  locale.set(next);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, next);
  }
}

// Re-export the stores the UI needs.
export { locale, _, isLoading };
export { _ as t };
