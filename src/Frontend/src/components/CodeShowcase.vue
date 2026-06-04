<script setup lang="ts">
// A "see it in code" section: a C# sample on the left, install commands on the right.
// All copy is CMS-driven (HomePage fields), so it's editable in /admin like everything else.
defineProps<{
  heading: string
  subtitle: string
  code: string
  install: string
}>()
</script>

<template>
  <section class="showcase">
    <div class="showcase-intro">
      <h2>{{ heading }}</h2>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div class="showcase-grid">
      <figure class="code-panel">
        <figcaption>HomePage.cs</figcaption>
        <pre><code>{{ code }}</code></pre>
      </figure>
      <figure v-if="install" class="code-panel code-panel--install">
        <figcaption>Install</figcaption>
        <pre><code>{{ install }}</code></pre>
      </figure>
    </div>
  </section>
</template>
