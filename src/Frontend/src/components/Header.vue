<script setup lang="ts">
import { inject, computed } from 'vue'
import type { SiteHeaderData, NavNode } from '../api'
import { mediaUrl } from '../api'

const header = inject<SiteHeaderData | null>('siteHeader', null)
const nav = inject<NavNode[]>('navTree', [])

const logoText = computed(() => header?.logoText || 'Klassd')
const logoSrc = computed(() => (header?.logoMediaId ? mediaUrl(header.logoMediaId) : ''))
</script>

<template>
  <header class="site-header">
    <div class="site-header-inner">
      <a class="brand" href="/">
        <img v-if="logoSrc" :src="logoSrc" :alt="logoText" class="brand-logo" />
        <span v-else class="brand-text">{{ logoText }}</span>
      </a>

      <nav v-if="nav.length" class="site-nav" aria-label="Primary">
        <a v-for="item in nav" :key="item.id" class="site-nav-link" :href="item.href">{{ item.label }}</a>
      </nav>

      <a v-if="header?.ctaText && header?.ctaUrl" class="header-cta" :href="header.ctaUrl">{{ header.ctaText }}</a>
    </div>
  </header>
</template>
