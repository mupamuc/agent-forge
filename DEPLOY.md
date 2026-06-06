# Deploying Agent Forge to GitHub Pages

Agent Forge is a static SPA (SvelteKit + adapter-static). It deploys to GitHub Pages
automatically via GitHub Actions. The workflow builds with the correct base path for
your repo subpath, so internal links work whether the site lives at the root or under
`username.github.io/<repo>/`.

## One-time setup

1. **Create a GitHub repository** (e.g. `agent-forge`) on GitHub.

2. **Connect your local repo and push** (you do this yourself — auth is on you):

   ```sh
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin master
   ```

3. **Enable GitHub Pages with Actions:**
   - Go to **Settings → Pages**.
   - Under **Build and deployment → Source**, choose **"GitHub Actions"**.

That's it. The workflow at `.github/workflows/deploy.yml` runs on every push to
`master` (and on manual dispatch). It detects the base path from your Pages
configuration and injects it as `BASE_PATH` at build time, so every internal link is
prefixed correctly.

## Result

After the workflow finishes, the site is live at:

```
https://<user>.github.io/<repo>/
```

## Notes

- The build emits `index.html` (for `/`) and `404.html` (SPA fallback for deep links
  like `/mission/<id>`), plus an empty `.nojekyll` so GitHub Pages keeps the `_app/`
  asset directory.
- Local and test builds use base `''` (run `npm run build` with no env var), so output
  is identical to development.
