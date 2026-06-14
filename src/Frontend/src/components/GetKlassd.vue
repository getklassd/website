<script setup lang="ts">
// Umbrella landing for getklassd.com — introduces the whole Klassd suite (CMS, Workflows, Auth)
// and routes to each product's own page. Static copy (not CMS-driven); prerenders into index.html.
import Hero from './Hero.vue'

interface Product { name: string; tagline: string; body: string; href: string; cta: string }
const products: Product[] = [
  {
    name: 'Klassd CMS',
    tagline: 'Headless CMS for .NET',
    body: 'Define your content model as C# classes and deliver it to any frontend over a clean JSON API. Drafts, versioning, roles and full-text search included.',
    href: '/cms',
    cta: 'Explore the CMS →',
  },
  {
    name: 'Klassd.Workflows',
    tagline: 'Background jobs & DAGs',
    body: 'Write jobs as C# classes and run each as its own Kubernetes pod — or a local process in dev. Schedule with cron, compose into DAG workflows, watch every run live.',
    href: '/workflows',
    cta: 'Explore Workflows →',
  },
  {
    name: 'Klassd.Auth',
    tagline: 'Self-hostable auth',
    body: 'A code-first authentication core: email/password, rotating sessions, social login & SSO, MFA, email verification and per-user metadata. One call ships the whole HTTP API.',
    href: '/auth',
    cta: 'Explore Auth →',
  },
]
</script>

<template>
  <Hero
    badge="Open-source .NET building blocks"
    title="Code-first building blocks for .NET"
    subtitle="getklassd.com is home to Klassd — a family of code-first, self-hostable libraries for .NET. A headless CMS, a background-job &amp; workflow engine, and an authentication core. Model everything as C# classes; ship it anywhere."
    cta-text="Browse the GitHub org"
    cta-url="https://github.com/getklassd"
  />

  <section class="products">
    <a v-for="(p, i) in products" :key="i" class="product-card" :href="p.href">
      <span class="product-tagline">{{ p.tagline }}</span>
      <h3>{{ p.name }}</h3>
      <p>{{ p.body }}</p>
      <span class="product-cta">{{ p.cta }}</span>
    </a>
  </section>

  <section class="compare-teaser">
    <p>All three are MIT-licensed, in beta, and published on NuGet.</p>
    <a class="cta" href="https://github.com/getklassd">View on GitHub →</a>
  </section>
</template>
