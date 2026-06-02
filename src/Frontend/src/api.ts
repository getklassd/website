// Thin client over the Klassd headless delivery API (the public, anonymous GET endpoints).
// With SSR the fetch happens on the server, so the base must be absolute. Order of precedence:
//   1. process.env.CMS_BASE  — runtime config for the SSR server (preferred in prod)
//   2. import.meta.env.VITE_CMS_BASE — build-time fallback
//   3. http://localhost:5080 — local CMS host (src/Backend)
// The `typeof process` guard keeps this safe in the client bundle, where `process` is undefined.
const CMS_BASE =
  (typeof process !== 'undefined' && process.env.CMS_BASE) ||
  import.meta.env.VITE_CMS_BASE ||
  'http://localhost:5080'

/** One block instance inside a page's block area (matches Klassd's PageRecord projection). */
export interface Block {
  blockTypeName: string
  data: Record<string, string>
  startUtc: string | null
  endUtc: string | null
  priority: number
}

/** A delivered page — Klassd's PageRecord, serialized camelCase. */
export interface Page {
  id: string
  contentId: string
  localeCode: string
  parentId: string | null
  pageTypeName: string
  name: string
  slug: string
  data: Record<string, string>
  blockAreas: Record<string, Block[]>
  createdAt: string
  updatedAt: string
}

export async function fetchPages(locale = 'en'): Promise<Page[]> {
  const res = await fetch(`${CMS_BASE}/api/pages?locale=${encodeURIComponent(locale)}`)
  if (!res.ok) throw new Error(`CMS responded ${res.status}`)
  return res.json() as Promise<Page[]>
}

/** The landing page: a HomePage at the root slug. */
export async function fetchHome(locale = 'en'): Promise<Page | null> {
  const pages = await fetchPages(locale)
  return pages.find((p) => p.pageTypeName === 'HomePage' && p.slug === '') ?? null
}

/** URL for a media item served by the CMS (media fields store the item id). */
export function mediaUrl(id: string): string {
  return `${CMS_BASE}/api/media/${id}`
}
