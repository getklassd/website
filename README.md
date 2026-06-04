# getklassd.com

The marketing site for [Klassd](https://github.com/getklassd/Klassd), built the way a headless CMS
is meant to be used: the CMS runs on its own and exposes a JSON delivery API, and a separate
**Vue 3 SSR** frontend consumes it.

```
website/
├─ klassd/            # Klassd CMS, as a git submodule (dogfooded against source pre-1.0)
└─ src/
   ├─ Backend/        # ASP.NET host wiring Klassd — serves /admin + the public /api  (.NET 10)
   └─ Frontend/       # Vue 3 server-side-rendered site that reads /api               (Bun + Vite)
```

The Backend renders **no public HTML** — it's purely the CMS (admin UI + headless API). The Frontend
fetches content from `/api/pages` during server-side rendering, returns fully-rendered HTML, then
hydrates on the client.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Bun](https://bun.sh/) (≥ 1.3)
- Git (the repo uses a submodule)

## Getting started

Clone **with submodules** (or run `git submodule update --init` after cloning):

```bash
git clone --recurse-submodules git@github.com:getklassd/website.git
cd website
```

**1. Run the CMS** (`src/Backend`) on `http://localhost:5080`:

```bash
dotnet run --project src/Backend
```

On first run it creates a SQLite database, seeds an `admin`/`admin` account, and seeds a starter
`HomePage` so the frontend has content. The admin is at <http://localhost:5080/admin>; the delivery
API is at <http://localhost:5080/api/pages>.

**2. Run the site** (`src/Frontend`) on `http://localhost:5173`:

```bash
cd src/Frontend
bun install
bun run dev
```

Open <http://localhost:5173>. Edit the HomePage in the CMS admin and refresh — the SSR'd page
reflects it (content comes from the CMS, not the code).

## How it consumes the CMS

- **Content model** lives in `src/Backend/Content/` as C# classes (`HomePage`, `FeatureBlock`).
  Klassd reflects over them to build the admin editor.
- **Delivery**: the frontend calls the anonymous `GET /api/pages?locale=en`, finds the `HomePage`,
  and renders its `data` fields + `features` block area. Types mirror the payload in
  `src/Frontend/src/api.ts`.
- **SSR data flow**: `entry-server.ts` fetches on the server → `renderToString` → HTML + embedded
  `window.__INITIAL_STATE__` → `entry-client.ts` hydrates with that state (no client refetch).

## Production build

```bash
cd src/Frontend
bun run build          # type-check + client bundle (dist/client) + SSR bundle (dist/server)
NODE_ENV=production bun run start
```

Configure where the SSR server reaches the CMS with `CMS_BASE` (runtime) or `VITE_CMS_BASE`
(build-time); see `src/Frontend/.env.example`. When the site and CMS are on different origins, set
the site origin in the CMS's CORS allow-list (`Klassd:Cors:AllowedOrigins` in
`src/Backend/appsettings.json`).

## Deploy (Docker)

Both services are containerized; `docker compose` runs the stack with the site talking to the CMS
over the internal network:

```bash
docker compose up --build
# site  → http://localhost:5173
# admin → http://localhost:5080/admin   (seeded admin/admin — change it)
```

- `src/Backend/Dockerfile` — CMS image. **Build context is the repo root** (it needs the `klassd/`
  submodule): `docker build -f src/Backend/Dockerfile .`. The SQLite DB persists in the `cms-data`
  volume (`/data`).
- `src/Frontend/Dockerfile` — Vue SSR image (`docker build src/Frontend`).
- `.github/workflows/ci.yml` builds both on every push/PR (checks out the submodule over HTTPS).

> The site fetches the CMS **server-side** (`CMS_BASE`), so the CMS port doesn't need to be public.
> Media URLs (`/api/media/...`) are the exception — if you use uploaded media, the CMS must be
> reachable from the browser and its origin added to the CORS allow-list. The seeded content uses
> no media (the logo falls back to the "Klassd" wordmark).

## Notes

- Pre-1.0, the Backend references Klassd via the `klassd/` **submodule + project references** so the
  site builds against live CMS source. Klassd is now [published to NuGet](https://www.nuget.org/packages/Klassd.Backoffice)
  (prerelease) — you can swap the project references for `<PackageReference Include="Klassd.*" Version="..." />`
  in `src/Backend/GetKlassd.Cms.csproj` if you'd rather build against the packages.
- Bun is the JS runtime and package manager. The SSR server (`src/Frontend/server.ts`) uses
  `node:http` (which Bun implements) to bridge Vite's dev middleware.
