<script setup lang="ts">
import { inject, computed } from 'vue'
import type { SiteFooterData } from '../api'

const footer = inject<SiteFooterData | null>('siteFooter', null)
const copyright = computed(() => footer?.copyright || '© Klassd')
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer-inner">
      <p v-if="footer?.tagline" class="footer-tagline">{{ footer.tagline }}</p>

      <div v-if="footer && footer.columns.length" class="footer-columns">
        <div v-for="(col, i) in footer.columns" :key="i" class="footer-column">
          <h4 v-if="col.heading">{{ col.heading }}</h4>
          <ul>
            <li v-for="(link, j) in col.links" :key="j"><a :href="link.url">{{ link.label }}</a></li>
          </ul>
        </div>
      </div>

      <p class="footer-meta">
        {{ copyright }}
        <span class="footer-credit">
          Content delivered headlessly by
          <a href="https://github.com/getklassd/Klassd">Klassd</a>.
          Built with <a href="https://claude.com/claude-code">Claude Code</a>.
        </span>
      </p>
    </div>
  </footer>
</template>
