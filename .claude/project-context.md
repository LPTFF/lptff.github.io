# Project Context

This file makes project evolution explicit. Keep it aligned with the current repository rather than preserving historical snapshots.

## Current baseline

- Stack: Vue 3, Vue Router 4, Vite 4, JavaScript and TypeScript.
- Entry flow: `index.html` → `src/main.js` → `src/App.vue` → `src/router/index.js`.
- Pages: `src/views/`; user-facing Markdown: `src/content/blog/` and `src/content/interview/`.
- Static assets: `public/`; large imported data snapshots: `src/public/data/`.
- Generated interview summaries: `public/findJob-summary/full.md` and `public/findJob-summary/chain.md`.
- Validation baseline: `npm run build`; browser-facing changes additionally require `npm run serve` and browser inspection.

## Iteration checklist

For every project iteration, review this file. Update the baseline in the same change when any of these areas change:

- architecture or application entry flow;
- directories or ownership of content/assets;
- routes or legacy redirects;
- dependencies, build commands, or validation requirements;
- generated files, source-to-output paths, or runtime data flow;
- broad-search exclusions documented in `CLAUDE.md`.

Small isolated UI or content edits do not require a baseline rewrite, but the checklist must still be reviewed.
