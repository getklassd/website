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
          Built with <a href="https://claude.com/claude-code">Claude Code</a>, reviewed by humans.
        </span>
        <span class="footer-credit">Made with <span class="footer-heart" aria-label="love">❤</span> in Denmark.</span>
        <span class="footer-credit footer-badge">
          <a href="https://dashboard.simpleanalytics.com/?utm_source=&amp;utm_content=badge&amp;affiliate=giwug" referrerpolicy="origin" target="_blank" rel="noopener">
            <img src="https://simpleanalyticsbadges.com/?mode=dark&amp;counter=false" loading="lazy" referrerpolicy="no-referrer" crossorigin="anonymous" alt="Analytics by Simple Analytics" />
          </a>
        </span>
      </p>
    </div>
  </footer>
</template>
