<script setup lang="ts">
import { inject, computed } from 'vue'
import type { SiteHeaderData } from '../api'
import { mediaUrl } from '../api'

const header = inject<SiteHeaderData | null>('siteHeader', null)

const logoText = computed(() => header?.logoText || 'Klassd')
const logoSrc = computed(() => (header?.logoMediaId ? mediaUrl(header.logoMediaId) : ''))
const navLinks = computed(() => header?.navLinks ?? [])

/** External links open in a new tab; internal (relative) links stay in-page. */
function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url)
}
</script>

<template>
  <header class="site-header">
    <div class="site-header-inner">
      <a class="brand" href="/">
        <img v-if="logoSrc" :src="logoSrc" :alt="logoText" class="brand-logo" />
        <span v-else class="brand-text">{{ logoText }}</span>
      </a>

      <nav v-if="navLinks.length" class="site-nav" aria-label="Primary">
        <a
          v-for="(item, i) in navLinks"
          :key="i"
          class="site-nav-link"
          :href="item.url"
          :target="isExternal(item.url) ? '_blank' : undefined"
          :rel="isExternal(item.url) ? 'noopener' : undefined"
        >{{ item.label }}</a>
      </nav>

      <a v-if="header?.ctaText && header?.ctaUrl" class="header-cta" :href="header.ctaUrl">{{ header.ctaText }}</a>
    </div>
  </header>
</template>
