# Help Centre content

Help articles are synced from **mynt-cfd-frontend** — `public/help-articles/` (HTML + `.md` + `assets/`) and `src/help/catalog.ts` (titles, excerpts, categories, popular flags). The CFD repo is the source of truth; do not edit articles or the catalog here.

Re-sync when CFD help PRs merge:

    scripts/sync-help.sh /path/to/mynt-cfd-frontend

`catalog.ts` is copied verbatim (Vite compiles TS). Category counts are derived from `ARTICLES` — never hardcode them. Pages: `src/pages/Guides.jsx` (index) and `src/pages/Guide.jsx` (reader, iframes `htmlPath?embed=1`).
