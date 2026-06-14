<script setup lang="ts">
import { inject, computed } from 'vue'
import type { Block, Page } from './api'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import Hero from './components/Hero.vue'
import FeatureCard from './components/FeatureCard.vue'
import CodeShowcase from './components/CodeShowcase.vue'
import GetKlassd from './components/GetKlassd.vue'
import Docs from './components/Docs.vue'
import Workflows from './components/Workflows.vue'
import WorkflowsDocs from './components/WorkflowsDocs.vue'
import Auth from './components/Auth.vue'
import AuthDocs from './components/AuthDocs.vue'

// Provided by app.ts — fetched during SSR, reused on hydration (no client refetch).
const page = inject<Page | null>('initialPage', null)
const route = inject<string>('route', '/')
const isHome = computed(() => route === '/')
const isCms = computed(() => route === '/cms')
const isDocs = computed(() => route === '/cms/docs')
const isWorkflows = computed(() => route === '/workflows')
const isWorkflowsDocs = computed(() => route === '/workflows/docs')
const isAuth = computed(() => route === '/auth')
const isAuthDocs = computed(() => route === '/auth/docs')

function features(p: Page): Block[] {
  return p.blockAreas['features'] ?? []
}
</script>

<template>
  <div class="site">
    <Header />
    <main>
      <GetKlassd v-if="isHome" />

      <Docs v-else-if="isDocs" />

      <WorkflowsDocs v-else-if="isWorkflowsDocs" />

      <Workflows v-else-if="isWorkflows" />

      <AuthDocs v-else-if="isAuthDocs" />

      <Auth v-else-if="isAuth" />

      <template v-else-if="isCms && page">
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

        <section class="compare-teaser">
          <p>Want the full picture — quickstart, content &amp; property types, the delivery API and the package list?</p>
          <a class="cta" href="/cms/docs">Read the docs →</a>
        </section>

        <section class="compare-teaser">
          <p>Evaluating headless CMSs? See how Klassd's code-first approach compares to Umbraco and Payload.</p>
          <a class="cta" href="/cms/docs#comparison">Compare →</a>
        </section>
      </template>

      <p v-else class="status">No HomePage content yet — create one in the CMS admin at /admin.</p>
    </main>
    <Footer />
  </div>
</template>
