<script setup lang="ts">
// Marketing landing for the Klassd.Auth package — mirrors the CMS home page (Hero + feature
// grid + code showcase + teaser), but the copy is static (not CMS-driven) and it prerenders into
// /auth/index.html. The full docs live at /auth/docs (AuthDocs.vue).
import Hero from './Hero.vue'
import FeatureCard from './FeatureCard.vue'
import CodeShowcase from './CodeShowcase.vue'

interface Feature { title: string; body: string }
const features: Feature[] = [
  { title: 'Email & password', body: 'Sign-up and sign-in with PBKDF2-HMAC-SHA256 hashing and per-password salts — swap for Argon2id if you prefer. The endpoints ship with the library; you never hand-write them.' },
  { title: 'Passwordless codes', body: 'One-time codes over email or SMS — fixed-time compare, TTL and attempt lockout, no account enumeration. Bring your own sender or drop in the Twilio package for SMS.' },
  { title: 'Passkeys (WebAuthn)', body: 'Phishing-resistant FIDO2 sign-in built on Fido2NetLib, including usernameless/discoverable login. The ceremony challenge rides a stateless, DataProtection-protected cookie — multi-node safe, no shared cache.' },
  { title: 'Sessions done right', body: 'A short-lived, stateless access JWT plus an opaque, rotating refresh token. Reuse of a rotated refresh token is detected and revokes the session defensively.' },
  { title: 'Social login & SSO', body: 'OIDC (Microsoft Entra ID, Google) and OAuth 2.0 (GitHub, Facebook, Instagram, TikTok) external login, with a clean seam for adding your own provider.' },
  { title: 'Account linking', body: 'An account is one identity with many login methods. A passwordless user can add a password or link Facebook; unlink is guarded so the last method can never be removed. Opt-in auto-link only on a verified email.' },
  { title: 'MFA (TOTP)', body: 'Enroll a TOTP authenticator: the core generates a secret and an otpauth:// URI for the QR code, then verifies six-digit codes at sign-in.' },
  { title: 'Email verification', body: 'Send a verification link and consume single-use tokens. Tokens are hashed, TTL-bound and persisted by the storage adapter, so they survive restarts and scale across nodes.' },
  { title: 'Per-user typed metadata', body: 'Store app-specific data as one JSON document accessed through typed sections — so two apps (CMS + Workflows) never collide. Roles ride the same mechanism.' },
  { title: 'Pluggable storage', body: 'The core depends only on IUserStore / ISessionStore / IUserMetadataStore. Bind a database with a Data.* adapter — SQLite, PostgreSQL or MongoDB — using raw drivers, no EF/ORM.' },
  { title: 'Multi-tenancy', body: 'Serve many tenants from one database: every identity lookup is scoped to the tenant and the access token carries it as a tnt claim, so the same email can exist independently per tenant. Defaults to a single "public" tenant — single-tenant apps change nothing.' },
  { title: 'Drop-in cookie sign-in', body: 'For Blazor / server-rendered apps, add cookie delivery and the external-SSO seam with one call. Optional loopback bypass means no login on localhost / port-forward.' },
  { title: 'RS256 + JWKS by default', body: 'With a database adapter, signing defaults to rotating RS256 — keys persisted and auto-rotated — publishing JWKS and an OpenID discovery doc so resource servers validate via discovery. HS256 shared-secret is an opt-out.' },
  { title: 'Admin dashboard', body: 'A drop-in Blazor admin UI to maintain users — list/search, create, enable/disable, set password, edit roles, manage linked methods, and delete or anonymize. It can also run an import (file or live DB) as a background job with live progress. One MapKlassdAuthDashboard() call.' },
  { title: 'Automation webhooks', body: 'Inbound HMAC-signed webhooks let a customer-service tool disable, delete or anonymize a user — so a support ticket can be automated end-to-end, with replay protection and an audit log.' },
  { title: 'Custom claims & sessions', body: 'Add claims to every access token with an enricher (fresh on each refresh), or merge into a live session — the SuperTokens MergeIntoAccessTokenPayload equivalent, resolvable straight from the request. Arrays become real JSON claims.' },
  { title: 'Override anything', body: 'Every core service is an interface with a delegating decorator — wrap it, change one method, call base for the rest. The same model as SuperTokens recipe-function overrides, with session-create and third-party post-sign-in hooks that hand you the session.' },
  { title: 'Migrate from Auth0 / SuperTokens', body: 'Import an existing user base — bcrypt/argon2 passwords verify at login (no forced reset), plus social links, roles, metadata and TOTP. From a JSON export or by reading a SuperTokens core DB directly. Idempotent, dry-runnable, and can fold several databases into one multi-tenant instance.' },
]

const quickstartCode = `builder.Services
    .AddKlassdAuth(new SessionConfig { SigningKey = "<32+ byte secret>" })
    .UseSqlite("Data Source=klassd-auth.db");   // or .UsePostgres(...) / .UseMongoDb(...)

var app = builder.Build();
app.MapKlassdAuth();   // mounts the full HTTP API; schema is created automatically at startup
app.Run();`

const installCode = `# Klassd.Auth is in beta — install the prerelease packages
dotnet add package Klassd.Auth.Core --prerelease
dotnet add package Klassd.Auth.Data.Sqlite --prerelease
dotnet add package Klassd.Auth.AspNetCore --prerelease`
</script>

<template>
  <Hero
    badge="Auth for .NET"
    title="Self-hostable authentication, in your own app"
    subtitle="Klassd.Auth is a code-first authentication core for .NET — email/password, passwordless codes, passkeys, rotating sessions, social login &amp; SSO, account linking, MFA and more. One MapKlassdAuth() call ships the whole HTTP API."
    cta-text="Get started on GitHub"
    cta-url="https://github.com/getklassd/Klassd.Auth"
  />

  <section class="features">
    <FeatureCard v-for="(f, i) in features" :key="i" :title="f.title" :body="f.body" />
  </section>

  <CodeShowcase
    heading="The whole host is a few lines"
    subtitle="Add the core, pick a storage adapter, and map the API. The endpoints are shipped by the library and the schema is created at startup — you don't hand-write any of it."
    code-caption="Program.cs"
    :code="quickstartCode"
    :install="installCode"
  />

  <section class="compare-teaser">
    <p>Want the full picture — passwordless, passkeys, account linking, cookie sign-in for Blazor, OIDC / social providers, token signing and the package list?</p>
    <a class="cta" href="/auth/docs">Read the docs →</a>
  </section>
</template>
