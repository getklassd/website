<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  ctaText?: string
  ctaUrl?: string
}>()
</script>

<template>
  <header class="hero">
    <div class="hero-inner">
      <span class="badge">Headless CMS for .NET</span>
      <h1>{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
      <a v-if="ctaText && ctaUrl" class="cta" :href="ctaUrl">{{ ctaText }} →</a>
    </div>
  </header>
</template>
