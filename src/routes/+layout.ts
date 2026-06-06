// Static, client-only app — we use localStorage for locale/progress and the engine runs in the
// browser. ssr=false everywhere; the adapter emits a single index.html fallback (SPA), so the
// dynamic /mission/[id] route resolves client-side without per-page prerendering.
export const prerender = false;
export const ssr = false;
