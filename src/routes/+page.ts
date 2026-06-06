// Prerender ONLY the root route so the build emits build/index.html (returns 200 for `/`).
// ssr stays false (inherited from +layout.ts), so this is a client-only shell, not a server render.
// Deep links fall back to 404.html (GitHub Pages convention) and resolve client-side.
export const prerender = true;
