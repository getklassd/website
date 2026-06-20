<script setup lang="ts">
// Docs for the Klassd.Auth package. Content lives here (not in the CMS) so it's versioned
// with the site and renders with zero CMS dependency — it prerenders into /auth/docs/index.html.
// The marketing landing lives at /auth (Auth.vue). Reuses the shared `docs-*` styles.

const installCode = `dotnet add package Klassd.Auth.Core --prerelease
dotnet add package Klassd.Auth.Data.Sqlite --prerelease       # storage adapter (or .Data.Postgres / .Data.MongoDb)
dotnet add package Klassd.Auth.AspNetCore --prerelease        # JSON/JWT HTTP API (MapKlassdAuth)
dotnet add package Klassd.Auth.AspNetCore.Cookies --prerelease  # cookie sign-in for Blazor / server-rendered apps
dotnet add package Klassd.Auth.Passwordless --prerelease      # one-time codes (email + SMS)
dotnet add package Klassd.Auth.Passkeys --prerelease          # passkeys (WebAuthn / FIDO2)
dotnet add package Klassd.Auth.Sms.Twilio --prerelease        # optional: Twilio SMS sender
dotnet add package Klassd.Auth.OpenIdConnect --prerelease     # OIDC external login + Entra ID + Google
dotnet add package Klassd.Auth.OAuth --prerelease             # OAuth 2.0 — GitHub, Facebook, Instagram, TikTok
dotnet add package Klassd.Auth.Dashboard --prerelease         # Blazor user-admin dashboard
dotnet add package Klassd.Auth.Webhooks --prerelease          # inbound HMAC webhooks (disable/delete/anonymize)`

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

const passwordlessCode = `auth.AddPasswordless();                    // 6-digit codes, 10-min TTL, 5 attempts (defaults)
auth.AddTwilioSms(sid, token, fromNumber); // optional: real SMS (otherwise codes log to the console)

app.MapKlassdPasswordless();               // JSON: POST /auth/passwordless/{start,verify}

// POST /auth/passwordless/start  { "identifier": "a@b.com", "channel": "Email" }  -> 202 (always)
// POST /auth/passwordless/verify { "identifier": "a@b.com", "channel": "Email", "code": "123456" }
//   -> session tokens; resolves or auto-provisions the user by email/phone.
// MapKlassdPasswordlessCookie() signs the user into the app cookie instead.`

const passkeyCode = `auth.AddPasskeys(o =>
{
    o.ServerDomain = "example.com";              // the WebAuthn relying-party id (use "localhost" in dev)
    o.Origins      = ["https://example.com"];
});

app.MapKlassdPasskeys();   // POST /passkeys/{register,login}/{options,verify}

// register/* requires an authenticated user; login supports usernameless / discoverable credentials.
// The ceremony challenge rides a stateless, DataProtection-protected cookie (multi-node safe).
// register/verify -> session tokens; MapKlassdPasskeysCookie() issues the app cookie instead.`

const linkingCode = `// Cookie endpoints — the signed-in user links to THEIR account:
//   GET  /auth/link/{scheme}   -> challenge a provider, attach it on the callback
//   POST /auth/link/password   -> a social-/passwordless-only user gains a password
//   POST /auth/unlink          -> remove a method (the last one is guarded)
//   GET  /auth/me/methods      -> list the caller's own login methods

// Or from code, via UserAccountService:
await accounts.LinkExternalAsync(userId, "facebook", info);  // never steals an identity owned elsewhere
await accounts.AddPasswordAsync(userId, password);           // false if a password already exists
await accounts.UnlinkAsync(userId, methodId);                // false if it is the last method

// Opt-in: auto-merge an unauthenticated social sign-in into an existing account, but ONLY on a
// provider-VERIFIED matching email (off by default — unverified-email auto-link is a takeover vector):
auth.AddKlassdAuthCookies(o => o.AutoLinkByVerifiedEmail = true);`

const collectEmailCode = `// Instagram & TikTok never share an email (Facebook may be denied), so those accounts are
// provisioned with PrimaryEmail = null. Collect + verify one after sign-in:

//   POST /auth/me/email            { email }   -> sends a verification link (409 if already in use)
//   GET  /auth/me/email/confirm?token=…        -> sets it as the user's VERIFIED primary email

// From code:
if (user.PrimaryEmail is null) { /* route to your "add your email" page */ }
await accounts.SetPrimaryEmailAsync(userId, email, verified: true);  // guards against an email owned elsewhere`

const externalCode = `// Microsoft Entra ID (Azure AD). tenantId can be a directory id, or "organizations"/"common".
auth.AddEntraId(
    tenantId:     builder.Configuration["Auth:Entra:TenantId"]!,
    clientId:     builder.Configuration["Auth:Entra:ClientId"]!,
    clientSecret: builder.Configuration["Auth:Entra:ClientSecret"]!);

auth.AddGoogle(clientId, clientSecret);        // OIDC
auth.AddGitHub(clientId, clientSecret);        // OAuth 2.0 (non-OIDC)
auth.AddFacebook(clientId, clientSecret);      // OAuth 2.0
auth.AddInstagram(clientId, clientSecret);     // OAuth 2.0 — no email returned
auth.AddTikTok(clientKey, clientSecret);       // OAuth 2.0 — no email returned
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

const resetCode = `// Self-service "forgot password" — emailed single-use link, no account enumeration:
//   POST /auth/password/forgot { "identifier": "a@b.com" }                    -> 202 (always)
//   POST /auth/password/reset  { "token": "…", "newPassword": "…" }            -> 204 / 400
//
// reset consumes the token, sets the password (adding an email/password method if the account had
// none) and REVOKES the user's existing sessions. Configure the link's base URL:
app.MapKlassdAuth(o => o.PasswordResetUrlBase = "https://app.example/reset-password");`

const dashboardCode = `auth.AddKlassdAuthDashboard();   // after AddKlassdAuth(...) + a storage adapter

// Configurable path (default "/auth/dashboard"); ALWAYS requires login (anonymous -> cookie login path).
app.MapKlassdAuthDashboard(authorizationPolicy: "Admin");
app.MapKlassdAuthDashboard("/admin/users", "Admin");   // …or mount it anywhere

// A self-contained branch — it owns routing/auth/antiforgery/static assets. The host only sets
// <RequiresAspNetWebAssets>true</RequiresAspNetWebAssets> in its csproj (else blazor.web.js 404s).`

const webhookCode = `auth.AddKlassdAuthWebhooks(o => o.SigningSecrets.Add(config["Auth:Webhooks:Secret"]!));
app.MapKlassdAuthWebhooks();   // POST /auth/webhooks/users

// The caller signs the request; Klassd.Auth verifies it (401 on forged/stale/unsigned):
//   X-Klassd-Timestamp: <unix seconds>
//   X-Klassd-Signature: sha256=<hex HMAC-SHA256 of "{timestamp}.{body}">
//   { "action": "disable"|"enable"|"delete"|"anonymize", "userId"|"email": "…", "reason": "…" }`

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

const overrideCode = `// Wrap any core service — the same model as SuperTokens recipe-function overrides.
auth.Override<IEmailPasswordService>((inner, sp) => new NoDisposableEmail(inner));

public sealed class NoDisposableEmail(IEmailPasswordService inner) : EmailPasswordServiceDecorator(inner)
{
    public override Task<AuthResult> SignUpAsync(string email, string password, CancellationToken ct = default) =>
        email.EndsWith("@tempmail.com", StringComparison.OrdinalIgnoreCase)
            ? Task.FromResult(new AuthResult(false, Error: "DISPOSABLE_EMAIL_BLOCKED"))
            : base.SignUpAsync(email, password, ct);   // call the original
}`

const claimsCode = `// Add custom claims to every access token (issued at sign-in AND on each refresh):
auth.AddAccessTokenClaims(async (ctx, sp, ct) =>
    (await sp.GetRequiredService<IRolesService>().GetRolesAsync(ctx.UserId, ct))
        .Select(r => new Claim(ClaimTypes.Role, r)));

// Or merge claims into a live session — the SuperTokens MergeIntoAccessTokenPayload equivalent.
// Resolve the session from the request (like GetSessionFromRequestContext), then merge:
var session = await http.GetKlassdSessionAsync();
await session!.MergeIntoAccessTokenPayloadAsync(new { picture, roles });   // persists, rides every refresh`

const thirdPartyHookCode = `// JWT third-party sign-in. After the code exchange + session creation, the hook gets the
// provider tokens + the live session — mirrors a SuperTokens post-sign-in-up override.
app.MapKlassdThirdParty();             // GET .../authurl  +  POST .../signin
auth.AddProvider<AzureAdProvider>();   // your IThirdPartyProvider (exchange returns profile + tokens)

auth.AddThirdPartySignInHook(async (ctx, sp, ct) =>
{
    var picture = await FetchGraphPhotoAsync(ctx.Tokens.AccessToken!, ct);   // call the provider
    await ctx.Session.MergeIntoAccessTokenPayloadAsync(new { picture, roles = ctx.Profile.Claims["roles"] });
});`

const migrateCode = `// Import users INTO Klassd.Auth. bcrypt/argon2 passwords verify at login (then upgrade to
// pbkdf2 on next use); social links, roles, metadata and TOTP carry over. Idempotent.
builder.Services.AddKlassdAuth(cfg).UsePostgres(cs).AddAuthMigration();

var report = await runner.RunAsync(
    new Auth0MigrationSource("auth0-export.json"),
    new MigrationOptions { DryRun = true });          // verify first; set false to apply

// SuperTokens: a JSON export, or read the running core DB directly:
var src = new SuperTokensPostgresMigrationSource("Host=…;Database=supertokens;…");  // or …MySql`

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'sessions', label: 'Email/password & sessions' },
  { id: 'passwordless', label: 'Passwordless (email & SMS)' },
  { id: 'passkeys', label: 'Passkeys (WebAuthn)' },
  { id: 'cookies', label: 'Cookie sign-in for Blazor' },
  { id: 'external', label: 'Social login & SSO' },
  { id: 'linking', label: 'Account linking' },
  { id: 'mfa', label: 'MFA (TOTP)' },
  { id: 'email', label: 'Email verification' },
  { id: 'reset', label: 'Password reset' },
  { id: 'dashboard', label: 'Admin dashboard' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'metadata', label: 'User metadata & roles' },
  { id: 'signing', label: 'Token signing' },
  { id: 'claims', label: 'Custom claims & sessions' },
  { id: 'extend', label: 'Overrides & hooks' },
  { id: 'migrate', label: 'Migrating in (Auth0 / SuperTokens)' },
  { id: 'storage', label: 'Storage adapters' },
  { id: 'packages', label: 'Packages' },
]

interface Feature { title: string; body: string }
const features: Feature[] = [
  { title: 'Email & password', body: 'Sign-up / sign-in with PBKDF2-HMAC-SHA256 hashing and per-password salts (swap for Argon2id if preferred). The endpoints ship with the library — you never hand-write them.' },
  { title: 'Passwordless codes', body: 'One-time codes over email or SMS — fixed-time compare, TTL and attempt lockout, no account enumeration. Bring your own sender, or drop in the Twilio package for SMS.' },
  { title: 'Passkeys (WebAuthn)', body: 'Phishing-resistant FIDO2 sign-in built on Fido2NetLib, including usernameless/discoverable login. The ceremony challenge rides a stateless, DataProtection-protected cookie — multi-node safe.' },
  { title: 'Sessions done right', body: 'A short-lived, stateless access JWT plus an opaque, rotating refresh token. Reuse of a rotated refresh token is detected and revokes the session defensively.' },
  { title: 'Social login & SSO', body: 'OIDC (Entra ID, Google) and OAuth 2.0 (GitHub, Facebook, Instagram, TikTok) external login, with a clean seam for adding your own provider.' },
  { title: 'Account linking', body: 'One identity, many login methods. Add a password or link a social account to an existing user; unlink is guarded so the last method can never be removed. Opt-in auto-link only on a verified email.' },
  { title: 'MFA (TOTP)', body: 'Enroll a TOTP authenticator: the core generates a secret and an otpauth:// URI for the QR code, then verifies six-digit codes at sign-in.' },
  { title: 'Email verification', body: 'Send a verification link and consume single-use tokens. Tokens are hashed, TTL-bound and persisted by the storage adapter, so they survive restarts and scale across nodes.' },
  { title: 'Per-user typed metadata', body: 'Store app-specific data as one JSON document accessed through typed sections, so two apps never collide. Roles ride the same mechanism via RolesService.' },
  { title: 'Pluggable storage', body: 'The core depends only on IUserStore / ISessionStore / IUserMetadataStore. Bind SQLite, PostgreSQL or MongoDB with a Data.* adapter — raw drivers, no EF/ORM.' },
  { title: 'Drop-in cookie sign-in', body: 'For Blazor / server-rendered apps, add cookie delivery and the external-SSO seam with one call. Optional loopback bypass means no login on localhost / port-forward.' },
  { title: 'JWKS & RS256 signing', body: 'HS256 by default, or asymmetric RS256 with a fixed or auto-rotating key set persisted in the store. Public keys are published at /auth/jwks.json for shared-secret-free validation.' },
  { title: 'Admin dashboard', body: 'A drop-in Blazor (Interactive Server) UI to maintain users — list/search, create, enable/disable, set password, edit roles, manage linked methods, and delete or anonymize (GDPR erasure).' },
  { title: 'Automation webhooks', body: 'Inbound HMAC-signed webhooks let a customer-service tool disable, delete or anonymize a user — so a support ticket can be automated end-to-end, with replay protection and an audit log.' },
  { title: 'Custom claims & sessions', body: 'Add claims to every access token with an enricher (fresh on each refresh), or merge into a live session — the SuperTokens MergeIntoAccessTokenPayload equivalent, resolvable from the request. Arrays land as real JSON claims.' },
  { title: 'Override anything (hooks)', body: 'Every core service is an interface with a delegating decorator — wrap it, change one method, call base for the rest. The same model as SuperTokens recipe-function overrides, plus session-create and third-party post-sign-in hooks that hand you the session.' },
  { title: 'Migrate in from Auth0 / SuperTokens', body: 'Import an existing user base — bcrypt/argon2 passwords verify at login (no forced reset), with social links, roles, metadata and TOTP. From a JSON export or by reading a SuperTokens core DB (Postgres/MySQL) directly. Idempotent, dry-runnable.' },
]

interface Pkg { id: string; purpose: string }
const packages: Pkg[] = [
  { id: 'Klassd.Auth.Abstractions', purpose: 'Store interfaces (IUserStore / ISessionStore / IUserMetadataStore) + DB-agnostic record types. No dependencies.' },
  { id: 'Klassd.Auth.Core', purpose: 'The auth logic: email/password, sessions, third-party login, MFA, email verification, and metadata — storage-agnostic. AddKlassdAuth().' },
  { id: 'Klassd.Auth.AspNetCore', purpose: 'JSON/JWT HTTP delivery — one MapKlassdAuth() call wires the whole API (signup/signin/refresh/logout, MFA, email, metadata, JWKS). MapKlassdAuthAdmin() adds protected admin endpoints.' },
  { id: 'Klassd.Auth.AspNetCore.Cookies', purpose: 'Cookie sign-in for server-rendered / Blazor apps + external-SSO & account-linking seam. AddKlassdAuthCookies() / UseKlassdAuthCookies(); optional loopback bypass.' },
  { id: 'Klassd.Auth.Passwordless', purpose: 'Passwordless one-time codes over email and SMS. AddPasswordless() + MapKlassdPasswordless() (JSON and cookie variants).' },
  { id: 'Klassd.Auth.Passkeys', purpose: 'Passkeys (WebAuthn / FIDO2) via Fido2NetLib, with a stateless DataProtection ceremony-challenge store. AddPasskeys() + MapKlassdPasskeys().' },
  { id: 'Klassd.Auth.Sms.Twilio', purpose: 'Twilio ISmsSender for passwordless-over-SMS delivery. AddTwilioSms(accountSid, authToken, fromNumber).' },
  { id: 'Klassd.Auth.Dashboard', purpose: 'Drop-in Blazor (Interactive Server) user-admin dashboard — list/create/disable/delete/anonymize, roles, linked methods. AddKlassdAuthDashboard() + MapKlassdAuthDashboard().' },
  { id: 'Klassd.Auth.Webhooks', purpose: 'Inbound HMAC-signed webhooks so external tooling can disable/enable/delete/anonymize a user. AddKlassdAuthWebhooks() + MapKlassdAuthWebhooks().' },
  { id: 'Klassd.Auth.OpenIdConnect', purpose: 'OIDC external login, including Microsoft Entra ID (AddEntraId) and Google (AddGoogle), plus AddOpenIdConnect() for any other OIDC provider.' },
  { id: 'Klassd.Auth.OAuth', purpose: 'OAuth 2.0 (non-OIDC) providers — GitHub, Facebook, Instagram, TikTok. Instagram/TikTok return no email.' },
  { id: 'Klassd.Auth.Data.Sqlite', purpose: 'SQLite storage adapter (raw Microsoft.Data.Sqlite, JSON-in-TEXT) — zero infrastructure for single-node deployments. UseSqlite().' },
  { id: 'Klassd.Auth.Data.Postgres', purpose: 'PostgreSQL storage adapter (raw Npgsql, jsonb). UsePostgres().' },
  { id: 'Klassd.Auth.Data.MongoDb', purpose: 'MongoDB storage adapter (MongoDB.Driver). UseMongoDb().' },
  { id: 'Klassd.Auth.Migration', purpose: 'Import users into Klassd.Auth from Auth0 & SuperTokens JSON exports — passwords, social links, roles, metadata, TOTP. AddAuthMigration() + MigrationRunner; idempotent, dry-runnable, multi-replica-safe startup guard.' },
  { id: 'Klassd.Auth.Migration.SuperTokens.Postgres', purpose: 'Read a SuperTokens core database directly over PostgreSQL (Npgsql) by connection string — no export needed.' },
  { id: 'Klassd.Auth.Migration.SuperTokens.MySql', purpose: 'Read a SuperTokens core database directly over MySQL (MySqlConnector) by connection string.' },
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
          email/password, passwordless codes, passkeys, rotating sessions, social login &amp; SSO,
          account linking, MFA, email verification and a per-user metadata store. The HTTP API ships
          with the library: one <strong>MapKlassdAuth()</strong> call mounts the core and the schema
          is created at startup.
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

      <!-- Passwordless -->
      <section id="passwordless" class="docs-section">
        <h2>Passwordless <span class="docs-opt">(email &amp; SMS one-time codes)</span></h2>
        <p>
          Add passwordless sign-in and map its endpoints. Codes are stored hashed with a TTL and an
          attempt counter, compared in fixed time, and delivered through the registered sender —
          email out of the box, or SMS via the Twilio package (otherwise codes log to the console):
        </p>
        <pre class="docs-code"><code>{{ passwordlessCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>No enumeration</strong> — <code>start</code> always returns <code>202</code>, never revealing whether the identifier maps to an account.</li>
          <li><strong>Throttled</strong> — codes expire (default 10 min) and lock out after a configurable number of failed attempts.</li>
          <li><strong>Resolve or provision</strong> — a successful <code>verify</code> finds the user by email/phone, or creates one. The cookie variant signs the user in instead of returning tokens.</li>
        </ul>
      </section>

      <!-- Passkeys -->
      <section id="passkeys" class="docs-section">
        <h2>Passkeys <span class="docs-opt">(WebAuthn / FIDO2)</span></h2>
        <p>
          Phishing-resistant passkeys built on <strong>Fido2NetLib</strong>, with usernameless /
          discoverable login. Registration runs against the authenticated user; the four ceremony
          endpoints handle the browser <code>navigator.credentials</code> round-trips:
        </p>
        <pre class="docs-code"><code>{{ passkeyCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Stateless challenge</strong> — the per-ceremony challenge is held in a DataProtection-protected cookie, so it works across nodes with no shared cache (an in-memory store is available for single-node).</li>
          <li><strong>Clone detection</strong> — the signature counter is persisted and validated on each assertion.</li>
          <li><strong>Credentials</strong> — stored in a <code>passkey_credentials</code> table per storage adapter; a user can register several.</li>
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
        <h2>Social login &amp; SSO <span class="docs-opt">(OIDC &amp; OAuth 2.0)</span></h2>
        <p>
          Add external providers on the same builder. On an unauthenticated sign-in the identity is
          auto-provisioned (or, opt-in, merged into a matching account) through
          <code>UserAccountService.ProvisionExternalAsync(...)</code>; a signed-in user links one
          explicitly (see <a href="#linking">Account linking</a>):
        </p>
        <pre class="docs-code"><code>{{ externalCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Entra ID</strong> — OIDC: stable id from the <code>oid</code> claim, name from <code>preferred_username</code>. <code>tenantId</code> can be a directory id or <code>organizations</code>/<code>common</code>.</li>
          <li><strong>Google</strong> — OIDC via <code>AddGoogle(...)</code> (<code>Klassd.Auth.OpenIdConnect</code>).</li>
          <li><strong>GitHub / Facebook / Instagram / TikTok</strong> — OAuth 2.0 via <code>AddGitHub/AddFacebook/AddInstagram/AddTikTok(...)</code> (<code>Klassd.Auth.OAuth</code>). Instagram and TikTok return <em>no email</em>, so they only ever explicit-link or provision a fresh account.</li>
          <li><strong>Anything else</strong> — <code>AddOpenIdConnect(name, configSection)</code> for any standards-compliant OIDC provider (Okta, Auth0, …).</li>
        </ul>
      </section>

      <!-- Account linking -->
      <section id="linking" class="docs-section">
        <h2>Account linking</h2>
        <p>
          An account is one identity with many <code>LoginMethod</code>s. A signed-in user can attach
          another provider, add a password, or remove a method — all keyed to their own session:
        </p>
        <pre class="docs-code"><code>{{ linkingCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Explicit &amp; safe</strong> — linking is tied to the authenticated session; an identity already owned by another user is never stolen (it returns a conflict).</li>
          <li><strong>Add a password</strong> — a social- or passwordless-only account can gain a password; passwordless stays available on any account carrying that email/phone.</li>
          <li><strong>Last-method guard</strong> — unlinking refuses to remove a user's final login method, so an account can't lock itself out.</li>
          <li><strong>Opt-in auto-link</strong> — an unauthenticated social sign-in merges into an existing account only on a provider-<em>verified</em> matching email (<code>AutoLinkByVerifiedEmail</code>, off by default).</li>
        </ul>

        <h3>Collecting an email from no-email providers</h3>
        <p>
          Instagram and TikTok never share an email (Facebook may be denied), so those accounts are
          provisioned with a <code>null</code> primary email — it's nullable by design. Collect and
          verify one after sign-in, then treat the account as complete:
        </p>
        <pre class="docs-code"><code>{{ collectEmailCode }}</code></pre>
        <p class="docs-note">
          <code>start</code> rejects an address already owned by another user; the confirm link's
          token is the proof of ownership, so the address becomes the user's <strong>verified</strong>
          primary email (and a usable passwordless identity). Apps that require an email can gate on
          <code>PrimaryEmail is null</code> and route to the collection page.
        </p>
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

      <!-- Password reset -->
      <section id="reset" class="docs-section">
        <h2>Password reset <span class="docs-opt">(forgot password)</span></h2>
        <p>
          Self-service reset by emailed single-use link. <code>forgot</code> always returns
          <code>202</code> (no account enumeration); <code>reset</code> sets the new password and
          revokes the user's existing sessions:
        </p>
        <pre class="docs-code"><code>{{ resetCode }}</code></pre>
      </section>

      <!-- Dashboard -->
      <section id="dashboard" class="docs-section">
        <h2>Admin dashboard <span class="docs-opt">(Blazor)</span></h2>
        <p>
          A drop-in Blazor (Interactive Server) UI to maintain users — list/search, create,
          enable/disable, set password, edit roles, manage linked login methods, and delete or
          anonymize behind a typed confirm. It talks in-process to the auth services (no extra API):
        </p>
        <pre class="docs-code"><code>{{ dashboardCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Requires login</strong> — the mount always authorizes; anonymous visitors are redirected to the cookie login path. Pass a policy to also gate by role.</li>
          <li><strong>Configurable path</strong> — defaults to <code>/auth/dashboard</code>; pass any base path to <code>MapKlassdAuthDashboard</code> to mount it elsewhere.</li>
          <li><strong>Destructive ops</strong> — disable (revokes sessions), hard <strong>delete</strong> (cascades sessions/passkeys/metadata), and <strong>anonymize</strong> (GDPR erasure: strips PII but keeps the id row).</li>
          <li><strong>Self-contained</strong> — a pipeline branch owning its routing/auth/antiforgery/static assets; ships its own stylesheet.</li>
        </ul>
      </section>

      <!-- Webhooks -->
      <section id="webhooks" class="docs-section">
        <h2>Webhooks <span class="docs-opt">(automate customer-service requests)</span></h2>
        <p>
          Let an external system (e.g. a support tool) disable, enable, delete or anonymize a user via
          an <strong>HMAC-signed</strong> request — so a "please close my account" ticket can be
          automated end-to-end:
        </p>
        <pre class="docs-code"><code>{{ webhookCode }}</code></pre>
        <p class="docs-note">
          Verification mirrors the Klassd CMS outbound signing scheme and adds a timestamp tolerance
          (default 300s) to reject replays. Forged/stale/unsigned requests get <code>401</code>;
          unknown users <code>404</code>; each applied action is logged for an audit trail.
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

      <!-- Custom claims & sessions -->
      <section id="claims" class="docs-section">
        <h2>Custom claims &amp; sessions</h2>
        <p>
          Shape what's in the access token. An <strong>enricher</strong> runs on every issue — at
          sign-in <em>and</em> on each refresh — so derived claims (roles, tenant) stay current. To add
          a claim known at a point in time (say, captured from a provider), <strong>merge it into the
          session</strong>: it's persisted and rides every future token — the equivalent of
          SuperTokens' <code>sessionContainer.MergeIntoAccessTokenPayload</code>, and you can resolve the
          session straight from the request like <code>GetSessionFromRequestContext</code>.
        </p>
        <pre class="docs-code"><code>{{ claimsCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Typed values</strong> — strings become string claims; arrays/objects become real JSON claims (a <code>roles</code> string[] lands as a JWT array, mapped to <code>ClaimTypes.Role</code>).</li>
          <li><strong>Stamp on create</strong> — <code>AddSessionCreateHook(...)</code> is handed the live session as each one is created (the <code>CreateNewSession</code> override analogue).</li>
          <li><strong>Session data</strong> — entries set at sign-in are namespaced with an <code>sd_</code> prefix by default (configurable, or off).</li>
        </ul>
      </section>

      <!-- Overrides & hooks -->
      <section id="extend" class="docs-section">
        <h2>Overrides &amp; hooks</h2>
        <p>
          Every core service is an interface with a delegating decorator base. <strong>Wrap any of
          them</strong> to inject your own logic and call <code>base</code> for the original — the same
          model as SuperTokens recipe-function overrides. The whole suite (HTTP endpoints, cookie
          sign-in, webhooks) resolves services by interface, so an override applies everywhere.
        </p>
        <pre class="docs-code"><code>{{ overrideCode }}</code></pre>
        <p>
          For third-party sign-in, a <strong>post-sign-in hook</strong> hands you the provider's tokens
          and the live session — so you can call the provider's APIs (e.g. fetch a profile picture) and
          merge claims onto the token, just like a SuperTokens post-sign-in-up override:
        </p>
        <pre class="docs-code"><code>{{ thirdPartyHookCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Overridable</strong> — email/password, sessions, third-party, password reset, email verification, user accounts, lifecycle, roles, metadata and TOTP.</li>
          <li><strong>Stackable</strong> — register more than one; the last wraps the previous.</li>
          <li><strong>Per-provider mapping</strong> — <code>MapExternalProfile(scheme, …)</code> overrides how one provider's claims map to a user (the <code>GetUserInfo</code> analogue).</li>
        </ul>
      </section>

      <!-- Migration -->
      <section id="migrate" class="docs-section">
        <h2>Migrating in <span class="docs-opt">(from Auth0 / SuperTokens)</span></h2>
        <p>
          Move an existing user base onto Klassd.Auth without forcing a password reset:
          <strong>bcrypt and argon2 hashes verify at login</strong> (then silently upgrade to the native
          pbkdf2 on next use). Social links, passwordless identities, roles, metadata and TOTP secrets
          carry over too. Runs are <strong>idempotent</strong> and dry-runnable.
        </p>
        <pre class="docs-code"><code>{{ migrateCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Sources</strong> — Auth0 bulk-export / import JSON, SuperTokens bulk-import JSON, or a SuperTokens core database read directly (PostgreSQL or MySQL).</li>
          <li><strong>Safe to run in K8s</strong> — ship it as a one-shot Job/initContainer, or embed it in startup guarded by a durable ledger + distributed lease so it runs exactly once across replicas.</li>
          <li><strong>Honest reporting</strong> — the report counts created / merged / skipped / failed, and flags any password that couldn't be migrated (so those users reset).</li>
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
