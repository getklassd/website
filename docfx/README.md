# API reference (DocFX)

Generates the **type-by-type API reference** at `/cms/docs/api` from the Klassd source XML
documentation comments. This is the API half of the hybrid docs setup — the curated guides
and quickstart live in the Vue app (`src/Frontend/src/components/Docs.vue`, served at `/cms/docs`).

## Build

```bash
# from the repo root
dotnet tool restore                 # installs DocFX (pinned in .config/dotnet-tools.json)
dotnet docfx docfx/docfx.json
```

Output lands in `src/Frontend/dist/client/cms/docs/api/`, so it ships inside the GitHub Pages
deploy artifact alongside the prerendered Vue site.

> **Ordering matters.** `vite build` empties `dist/client`, so DocFX must run **after**
> `bun run build:static`. The Pages workflow (`.github/workflows/pages.yml`) does exactly that.

## What it documents

The public packable projects, via `metadata` in `docfx.json`:
`Klassd.Abstractions`, `Klassd.Core`, `Klassd.Backoffice`.

The source comes from the **`klassd` git submodule**. The reference reflects whatever commit
the submodule is pinned to — bump the submodule to surface newly added API.

## Theme

Uses the built-in `default` + `modern` templates plus `templates/klassd` (a thin CSS overlay
in `public/main.css`) to tint the accent to Klassd coral and link the brand back to `/cms/docs`.
Generated metadata (`api/`) and any local `_site/` are git-ignored.
