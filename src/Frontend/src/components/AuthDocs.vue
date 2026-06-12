<script setup lang="ts">
// Docs for the Klassd.Auth package. Content lives here (not in the CMS) so it's versioned
// with the site and renders with zero CMS dependency — it prerenders into /auth/docs/index.html.
// The marketing landing lives at /auth (Auth.vue). Reuses the shared `docs-*` styles.

const installCode = `dotnet add package Klassd.Auth.Core --prerelease
dotnet add package Klassd.Auth.Data.Sqlite --prerelease       # storage adapter (or .Data.Postgres / .Data.MongoDb)
dotnet add package Klassd.Auth.AspNetCore --prerelease        # JSON/JWT HTTP API (MapKlassdAuth)
dotnet add package Klassd.Auth.AspNetCore.Cookies --prerelease  # cookie sign-in for Blazor / server-rendered apps
dotnet add package Klassd.Auth.OpenIdConnect --prerelease     # OIDC external login + Entra ID + Google
dotnet add package Klassd.Auth.OAuth --prerelease             # OAuth 2.0 providers — GitHub`

const quickstartCode = `builder.Services
    .AddKlassdAuth(new SessionConfig { SigningKey = "<32+ byte secret>" })
    .UseSqlite("Data Source=klassd-auth.db");   // or .UsePostgres(...) / .UseMongoDb(...)

var app = builder.Build();
app.MapKlassdAuth();   // mounts the full HTTP API; schema is created automatically at startup
app.Run();`

const sessionCode = `// POST /auth/signup and /auth/signin return session tokens:
//   { accessToken, refreshToken, expiresAt }
// The access token is a short-lived JWT; the refresh token is opaque and rotating.

// POST /auth/refresh rotates the refresh token and issues a new access token.
// Reusing an already-rotated refresh token is detected and revokes the session.
// POST /auth/logout revokes a session.

// From code, the same logic is available through UserAccountService:
var user = await accounts.CreateLocalAsync(username: null, email: "a@x.com", password);
if (accounts.VerifyPassword(user, password) && !user.Disabled) { /* issue tokens */ }
await accounts.SetDisabledAsync(user.Id, true);   // soft-delete`

const cookieCode = `var auth = builder.Services
    .AddKlassdAuth(new SessionConfig { SigningKey = "..." })
    .UseSqlite("Data Source=klassd-auth.db");

auth.AddKlassdAuthCookies(o =>
{
    o.CookieName = "cms_auth";                 // or "klassd_wf_auth"
    o.SeedAdminUsername = "admin";
    o.SeedAdminPassword = builder.Configuration["Seed:AdminPassword"];
    o.SeedAdminRoles = ["Administrator"];
    o.BypassOnLoopback = true;                 // Workflows-style dev bypass (optional)
});

var app = builder.Build();
app.UseKlassdAuthCookies();   // wires middleware + /auth/login, /auth/logout, /auth/external/{scheme}
app.Run();`

const externalCode = `// Microsoft Entra ID (Azure AD). tenantId can be a directory id, or "organizations"/"common".
auth.AddEntraId(
    tenantId:     builder.Configuration["Auth:Entra:TenantId"]!,
    clientId:     builder.Configuration["Auth:Entra:ClientId"]!,
    clientSecret: builder.Configuration["Auth:Entra:ClientSecret"]!);

auth.AddGoogle(clientId, clientSecret);        // OIDC
auth.AddGitHub(clientId, clientSecret);        // OAuth 2.0 (non-OIDC)
auth.AddOpenIdConnect("Company SSO", config.GetSection("Oidc"));  // any other OIDC provider`

const mfaCode = `// POST /auth/mfa/enroll  → generates a TOTP secret + an otpauth:// URI (render as a QR code)
//   { secret, otpauthUri }
// POST /auth/mfa/verify  → verifies a six-digit TOTP code
//   { userId, code } → { verified: true }`

const verifyCode = `// POST /auth/email/send-verification → sends a verification link with a single-use token
// GET  /auth/email/verify?token=…      → consumes the token, marks the email verified
//
// Tokens are hashed, TTL-bound and persisted by the storage adapter, so they survive
// restarts and work across multiple nodes.`

const metadataCode = `// One JSON document per user, accessed through typed sections so apps never collide:
await meta.SetAsync(userId, "cms:prefs", new CmsPrefs { Theme = "dark", Locale = "da" });
var prefs = await meta.GetAsync<CmsPrefs>(userId, "cms:prefs");

// Over HTTP:
//   GET   /auth/users/{id}/metadata    → read the metadata JSON
//   PATCH /auth/users/{id}/metadata    → shallow-merge (null removes a key)

// Roles use the same mechanism, via RolesService:
await roles.SetRolesAsync(userId, ["Administrator"]);
var isAdmin = await roles.IsInRoleAsync(userId, "Administrator");`

const signingCode = `// HS256 by default (shared SigningKey). For asymmetric signing:
auth.UseRsaSigning(rsa);                  // or .UseRsaSigning(pemString) — fixed RS256 key
auth.UseRotatingRsaSigning(o =>           // RS256, keys persisted + auto-rotated in the store
{
    o.SigningKeyLifetime = TimeSpan.FromDays(30);
    o.ValidationGrace    = TimeSpan.FromDays(7);
});

// Either way, public keys are published at /auth/jwks.json so resource
// servers validate tokens without a shared secret.`

const adminCode = `app.MapKlassdAuthAdmin(authorizationPolicy: "Admin");
//   GET/POST       /auth/admin/users
//   GET            /auth/admin/users/{id}
//   POST           /auth/admin/users/{id}/disable
//   POST           /auth/admin/users/{id}/reset-password
//   GET/PUT        /auth/admin/users/{id}/roles
// Responses never include password hashes.`

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'sessions', label: 'Email/password & sessions' },
  { id: 'cookies', label: 'Cookie sign-in for Blazor' },
  { id: 'external', label: 'External login (OIDC / Entra)' },
  { id: 'mfa', label: 'MFA (TOTP)' },
  { id: 'email', label: 'Email verification' },
  { id: 'metadata', label: 'User metadata & roles' },
  { id: 'signing', label: 'Token signing' },
  { id: 'storage', label: 'Storage adapters' },
  { id: 'packages', label: 'Packages' },
]

interface Feature { title: string; body: string }
const features: Feature[] = [
  { title: 'Email & password', body: 'Sign-up / sign-in with PBKDF2-HMAC-SHA256 hashing and per-password salts (swap for Argon2id if preferred). The endpoints ship with the library — you never hand-write them.' },
  { title: 'Sessions done right', body: 'A short-lived, stateless access JWT plus an opaque, rotating refresh token. Reuse of a rotated refresh token is detected and revokes the session defensively.' },
  { title: 'Social login & SSO', body: 'OpenID Connect external login — Microsoft Entra ID, Google, and GitHub (OAuth) — linked or auto-provisioned by email, with a clean seam for adding your own provider.' },
  { title: 'MFA (TOTP)', body: 'Enroll a TOTP authenticator: the core generates a secret and an otpauth:// URI for the QR code, then verifies six-digit codes at sign-in.' },
  { title: 'Email verification', body: 'Send a verification link and consume single-use tokens. Tokens are hashed, TTL-bound and persisted by the storage adapter, so they survive restarts and scale across nodes.' },
  { title: 'Per-user typed metadata', body: 'Store app-specific data as one JSON document accessed through typed sections, so two apps never collide. Roles ride the same mechanism via RolesService.' },
  { title: 'Pluggable storage', body: 'The core depends only on IUserStore / ISessionStore / IUserMetadataStore. Bind SQLite, PostgreSQL or MongoDB with a Data.* adapter — raw drivers, no EF/ORM.' },
  { title: 'Drop-in cookie sign-in', body: 'For Blazor / server-rendered apps, add cookie delivery and the external-SSO seam with one call. Optional loopback bypass means no login on localhost / port-forward.' },
  { title: 'JWKS & RS256 signing', body: 'HS256 by default, or asymmetric RS256 with a fixed or auto-rotating key set persisted in the store. Public keys are published at /auth/jwks.json for shared-secret-free validation.' },
]

interface Pkg { id: string; purpose: string }
const packages: Pkg[] = [
  { id: 'Klassd.Auth.Abstractions', purpose: 'Store interfaces (IUserStore / ISessionStore / IUserMetadataStore) + DB-agnostic record types. No dependencies.' },
  { id: 'Klassd.Auth.Core', purpose: 'The auth logic: email/password, sessions, third-party login, MFA, email verification, and metadata — storage-agnostic. AddKlassdAuth().' },
  { id: 'Klassd.Auth.AspNetCore', purpose: 'JSON/JWT HTTP delivery — one MapKlassdAuth() call wires the whole API (signup/signin/refresh/logout, MFA, email, metadata, JWKS). MapKlassdAuthAdmin() adds protected admin endpoints.' },
  { id: 'Klassd.Auth.AspNetCore.Cookies', purpose: 'Cookie sign-in for server-rendered / Blazor apps + external-SSO seam. AddKlassdAuthCookies() / UseKlassdAuthCookies(); optional loopback bypass.' },
  { id: 'Klassd.Auth.OpenIdConnect', purpose: 'OIDC external login, including Microsoft Entra ID (AddEntraId) and Google (AddGoogle), plus AddOpenIdConnect() for any other OIDC provider.' },
  { id: 'Klassd.Auth.OAuth', purpose: 'OAuth 2.0 (non-OIDC) providers — GitHub (AddGitHub).' },
  { id: 'Klassd.Auth.Data.Sqlite', purpose: 'SQLite storage adapter (raw Microsoft.Data.Sqlite, JSON-in-TEXT) — zero infrastructure for single-node deployments. UseSqlite().' },
  { id: 'Klassd.Auth.Data.Postgres', purpose: 'PostgreSQL storage adapter (raw Npgsql, jsonb). UsePostgres().' },
  { id: 'Klassd.Auth.Data.MongoDb', purpose: 'MongoDB storage adapter (MongoDB.Driver). UseMongoDb().' },
]
</script>

<template>
  <div class="docs">
    <aside class="docs-side">
      <nav class="docs-toc" aria-label="Auth sections">
        <p class="docs-toc-title">Klassd.Auth</p>
        <a v-for="s in sections" :key="s.id" :href="`#${s.id}`" class="docs-toc-link">{{ s.label }}</a>
        <a href="https://github.com/getklassd/Klassd.Auth" target="_blank" rel="noopener" class="docs-toc-link docs-toc-api">GitHub repo →</a>
      </nav>
    </aside>

    <article class="docs-body">
      <header class="docs-head">
        <span class="badge">Auth</span>
        <h1>Self-hostable authentication for .NET</h1>
        <p class="docs-lede">
          Klassd.Auth is a code-first, NuGet-distributed authentication core for .NET —
          email/password, rotating sessions, social login &amp; SSO, MFA, email verification and a
          per-user metadata store. The HTTP API ships with the library: one
          <strong>MapKlassdAuth()</strong> call mounts the whole thing and the schema is created at
          startup.
        </p>
        <p class="docs-lede-meta">
          ← Back to the <a href="/auth">Auth overview</a>. A companion to
          <a href="/">Klassd</a>, the code-first headless CMS — same philosophy, separate package.
        </p>
      </header>

      <!-- Overview -->
      <section id="overview" class="docs-section">
        <h2>What you get</h2>
        <div class="docs-cards">
          <div v-for="f in features" :key="f.title" class="docs-card">
            <h3>{{ f.title }}</h3>
            <p>{{ f.body }}</p>
          </div>
        </div>
      </section>

      <!-- Quickstart -->
      <section id="quickstart" class="docs-section">
        <h2>Quickstart</h2>
        <p>Install the core plus a storage adapter and the HTTP delivery package. While Klassd.Auth is in beta the packages are prerelease:</p>
        <pre class="docs-code"><code>{{ installCode }}</code></pre>

        <h3>Wire it up in <code>Program.cs</code></h3>
        <p>
          <code>AddKlassdAuth(...)</code> returns a builder you use to pick a storage adapter;
          <code>MapKlassdAuth()</code> mounts the full HTTP API and creates the schema at startup:
        </p>
        <pre class="docs-code"><code>{{ quickstartCode }}</code></pre>
        <p class="docs-note">
          That's the whole host. The endpoints are shipped by the library — you don't hand-write
          them. The <code>Klassd.Auth.Sample</code> project is a complete, runnable example.
        </p>
      </section>

      <!-- Sessions -->
      <section id="sessions" class="docs-section">
        <h2>Email/password &amp; sessions</h2>
        <p>
          Sign-up and sign-in return a <strong>short-lived access JWT</strong> (stateless) plus an
          <strong>opaque, rotating refresh token</strong>. Passwords are hashed with PBKDF2-HMAC-SHA256
          and a per-password salt.
        </p>
        <pre class="docs-code"><code>{{ sessionCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Rotation</strong> — <code>POST /auth/refresh</code> issues a new access token and rotates the refresh token; the previous one is invalidated.</li>
          <li><strong>Reuse detection</strong> — replaying a rotated refresh token revokes the session defensively (a sign of token theft).</li>
          <li><strong>From code</strong> — the same logic is available through <code>UserAccountService</code>, the union of what the CMS and Workflows user services expose, so it can back an app's existing Blazor cookie sign-in.</li>
        </ul>
      </section>

      <!-- Cookies -->
      <section id="cookies" class="docs-section">
        <h2>Cookie sign-in for Blazor <span class="docs-opt">(server-rendered)</span></h2>
        <p>
          For Blazor / server-rendered apps, add the cookie delivery on the same builder. This gives
          <code>POST /auth/login</code> (username-or-email + password), <code>POST /auth/logout</code>,
          and <code>GET /auth/external/{scheme}</code> → provider → callback that provisions the user
          and issues the app cookie:
        </p>
        <pre class="docs-code"><code>{{ cookieCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Seed admin</strong> — a first user is created from config on a fresh deployment, so you're never locked out.</li>
          <li><strong>Loopback bypass</strong> — set <code>BypassOnLoopback = true</code> so requests from <code>127.0.0.1</code>/<code>::1</code> skip auth, making local dev <em>and</em> <code>kubectl port-forward</code> need no login. Ingress traffic is always authenticated.</li>
        </ul>
      </section>

      <!-- External -->
      <section id="external" class="docs-section">
        <h2>External login (OIDC / Entra ID / Google / GitHub)</h2>
        <p>
          Add external providers on the same builder. An SSO identity is linked to an existing user by
          email, or auto-provisioned, through <code>UserAccountService.ProvisionExternalAsync(...)</code>:
        </p>
        <pre class="docs-code"><code>{{ externalCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Entra ID</strong> — OIDC under the hood: stable id from the <code>oid</code> claim, name from <code>preferred_username</code>. <code>tenantId</code> can be a directory id or <code>organizations</code>/<code>common</code>.</li>
          <li><strong>Google</strong> — OIDC via <code>AddGoogle(clientId, clientSecret)</code>.</li>
          <li><strong>GitHub</strong> — OAuth 2.0 (non-OIDC) via <code>AddGitHub(...)</code> from <code>Klassd.Auth.OAuth</code>.</li>
          <li><strong>Anything else</strong> — <code>AddOpenIdConnect(name, configSection)</code> for any standards-compliant OIDC provider (Okta, Auth0, …).</li>
        </ul>
      </section>

      <!-- MFA -->
      <section id="mfa" class="docs-section">
        <h2>MFA (TOTP)</h2>
        <p>
          Time-based one-time passwords: the core generates a secret and an <code>otpauth://</code> URI
          you render as a QR code, then verifies six-digit codes.
        </p>
        <pre class="docs-code"><code>{{ mfaCode }}</code></pre>
      </section>

      <!-- Email verification -->
      <section id="email" class="docs-section">
        <h2>Email verification</h2>
        <p>Send a verification link and consume single-use tokens:</p>
        <pre class="docs-code"><code>{{ verifyCode }}</code></pre>
        <p class="docs-note">
          Verification tokens are hashed, TTL-bound and single-use, persisted by the storage adapter —
          so they survive restarts and scale across nodes.
        </p>
      </section>

      <!-- Metadata -->
      <section id="metadata" class="docs-section">
        <h2>User metadata &amp; roles</h2>
        <p>
          Everything app-specific lives in <strong>typed metadata</strong> — stored as one JSON
          document but accessed as typed sections, so two apps (CMS + Workflows) never collide. Roles
          use the same mechanism:
        </p>
        <pre class="docs-code"><code>{{ metadataCode }}</code></pre>
        <p>
          The <code>User</code> model carries the shared identity/lifecycle fields —
          <code>Username</code> (optional), <code>PrimaryEmail</code>, <code>Disabled</code>, and one or
          more <code>LoginMethod</code>s (local password and/or external provider). Each app maps role
          strings to its own capability/permission model.
        </p>
        <h3>Admin user-management API</h3>
        <p><code>MapKlassdAuthAdmin(...)</code> adds protected admin endpoints:</p>
        <pre class="docs-code"><code>{{ adminCode }}</code></pre>
      </section>

      <!-- Signing -->
      <section id="signing" class="docs-section">
        <h2>Token signing (HS256 / RS256 / rotating + JWKS)</h2>
        <p>Access tokens are HS256 by default (shared secret). For asymmetric signing:</p>
        <pre class="docs-code"><code>{{ signingCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Fixed RS256</strong> — <code>UseRsaSigning(rsa)</code> / <code>UseRsaSigning(pemString)</code> with a key you supply.</li>
          <li><strong>Rotating RS256</strong> — <code>UseRotatingRsaSigning(...)</code> persists keys in the storage adapter and auto-rotates: the newest key signs, recently-retired keys keep validating during a grace window, and expired keys are pruned.</li>
          <li><strong>JWKS</strong> — public key(s) are published at <code>/auth/jwks.json</code> so resource servers validate tokens without a shared secret (empty under HS256).</li>
        </ul>
      </section>

      <!-- Storage -->
      <section id="storage" class="docs-section">
        <h2>Storage adapters</h2>
        <p>
          The core depends only on <code>IUserStore</code>, <code>ISessionStore</code> and
          <code>IUserMetadataStore</code>; pick a <code>Data.*</code> adapter to bind a database. All
          adapters use <strong>raw drivers, no EF/ORM</strong>, matching the Klassd house convention.
        </p>
        <ul class="docs-list">
          <li><strong>SQLite</strong> — <code>UseSqlite("Data Source=…")</code>, raw <code>Microsoft.Data.Sqlite</code>, JSON-in-TEXT. Zero infrastructure for single-node deployments.</li>
          <li><strong>PostgreSQL</strong> — <code>UsePostgres("Host=…")</code>, raw <code>Npgsql</code>, <code>jsonb</code> documents.</li>
          <li><strong>MongoDB</strong> — <code>UseMongoDb("mongodb://…")</code>, <code>MongoDB.Driver</code>.</li>
        </ul>
        <p>Add your own by implementing the store interfaces — exactly how the three Data.* packages do it.</p>
      </section>

      <!-- Packages -->
      <section id="packages" class="docs-section">
        <h2>Packages</h2>
        <p>Install the core plus the adapters you need — each keeps its SDK isolated, so you only pull in what you wire up. While in beta, add <code>--prerelease</code>.</p>
        <div class="docs-table-wrap">
          <table class="docs-table">
            <thead><tr><th>Package</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr v-for="p in packages" :key="p.id">
                <td><a :href="`https://www.nuget.org/packages/${p.id}`" target="_blank" rel="noopener"><code class="docs-alias">{{ p.id }}</code></a></td>
                <td>{{ p.purpose }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="docs-cta-row">
          <a class="cta" href="https://github.com/getklassd/Klassd.Auth" target="_blank" rel="noopener">View on GitHub</a>
          <a class="docs-ghost" href="https://www.nuget.org/profiles/getklassd" target="_blank" rel="noopener">All NuGet packages</a>
        </p>
      </section>
    </article>
  </div>
</template>
