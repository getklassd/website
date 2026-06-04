<script setup lang="ts">
import { inject } from 'vue'
import type { Block, Page } from './api'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import Hero from './components/Hero.vue'
import FeatureCard from './components/FeatureCard.vue'
import CodeShowcase from './components/CodeShowcase.vue'

// Provided by app.ts — fetched during SSR, reused on hydration (no client refetch).
const page = inject<Page | null>('initialPage', null)

function features(p: Page): Block[] {
  return p.blockAreas['features'] ?? []
}
</script>

<template>
  <div class="site">
    <Header />
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

        <CodeShowcase
          v-if="page.data.codeSample"
          :heading="page.data.codeHeading"
          :subtitle="page.data.codeSubtitle"
          :code="page.data.codeSample"
          :install="page.data.installCommand"
        />
      </template>

      <p v-else class="status">No HomePage content yet — create one in the CMS admin at /admin.</p>
    </main>
    <Footer />
  </div>
</template>
