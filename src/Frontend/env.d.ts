/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

interface ImportMetaEnv {
  /** Base URL of the Klassd CMS delivery API. Empty = same-origin (dev proxy / prod reverse-proxy). */
  readonly VITE_CMS_BASE?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
