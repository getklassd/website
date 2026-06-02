<script setup lang="ts">
import { inject } from 'vue'
import type { Block, Page } from './api'
import Hero from './components/Hero.vue'
import FeatureCard from './components/FeatureCard.vue'

// Provided by app.ts — fetched during SSR, reused on hydration (no client refetch).
const page = inject<Page | null>('initialPage', null)

function features(p: Page): Block[] {
  return p.blockAreas['features'] ?? []
}
</script>

<template>
  <main>
    <template v-if="page">
      <Hero
        :title="page.data.heroTitle"
        :subtitle="page.data.heroSubtitle"
        :cta-text="page.data.ctaText"
        :cta-url="page.data.ctaUrl"
      />
      <section class="features">
        <FeatureCard
          v-for="(block, i) in features(page)"
          :key="i"
          :title="block.data.title"
          :body="block.data.body"
        />
      </section>
    </template>

    <p v-else class="status">No HomePage content yet — create one in the CMS admin at /admin.</p>

    <footer>
      Content delivered headlessly by
      <a href="https://github.com/getklassd/Klassd">Klassd</a>.
      <br />
      Klassd and this site were built with AI assistance
      (<a href="https://claude.com/claude-code">Claude Code</a>).
    </footer>
  </main>
</template>
