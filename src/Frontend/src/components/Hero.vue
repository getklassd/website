<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle: string
    ctaText?: string
    ctaUrl?: string
    badge?: string
  }>(),
  { badge: 'Headless CMS for .NET' },
)
</script>

<template>
  <header class="hero">
    <div class="hero-inner">
      <span class="badge">{{ badge }}</span>
      <h1>{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
      <a v-if="ctaText && ctaUrl" class="cta" :href="ctaUrl">{{ ctaText }} →</a>
    </div>
  </header>
</template>
