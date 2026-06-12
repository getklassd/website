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
  { title: 'Sessions done right', body: 'A short-lived, stateless access JWT plus an opaque, rotating refresh token. Reuse of a rotated refresh token is detected and revokes the session defensively.' },
  { title: 'Social login & SSO', body: 'OpenID Connect external login — Microsoft Entra ID, Google, GitHub (OAuth) — linked or auto-provisioned by email, with a clean seam for adding your own provider.' },
  { title: 'MFA (TOTP)', body: 'Enroll a TOTP authenticator: the core generates a secret and an otpauth:// URI for the QR code, then verifies six-digit codes at sign-in.' },
  { title: 'Email verification', body: 'Send a verification link and consume single-use tokens. Tokens are hashed, TTL-bound and persisted by the storage adapter, so they survive restarts and scale across nodes.' },
  { title: 'Per-user typed metadata', body: 'Store app-specific data as one JSON document accessed through typed sections — so two apps (CMS + Workflows) never collide. Roles ride the same mechanism.' },
  { title: 'Pluggable storage', body: 'The core depends only on IUserStore / ISessionStore / IUserMetadataStore. Bind a database with a Data.* adapter — SQLite, PostgreSQL or MongoDB — using raw drivers, no EF/ORM.' },
  { title: 'Drop-in cookie sign-in', body: 'For Blazor / server-rendered apps, add cookie delivery and the external-SSO seam with one call. Optional loopback bypass means no login on localhost / port-forward.' },
  { title: 'JWKS & RS256 signing', body: 'HS256 by default, or asymmetric RS256 with a fixed or auto-rotating key set persisted in the store. Public keys are published at /auth/jwks.json so resource servers validate without a shared secret.' },
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
    subtitle="Klassd.Auth is a code-first authentication core for .NET — email/password, rotating sessions, social login &amp; SSO, MFA, email verification and per-user metadata. One MapKlassdAuth() call ships the whole HTTP API."
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
    <p>Want the full picture — cookie sign-in for Blazor, OIDC / Entra ID, MFA, token signing and the package list?</p>
    <a class="cta" href="/auth/docs">Read the docs →</a>
  </section>
</template>
