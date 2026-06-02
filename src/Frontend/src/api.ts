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

/** A CMS singleton (global): same projection shape as a page minus the tree fields. */
export interface Global {
  data: Record<string, string>
  blockAreas: Record<string, Block[]>
}

export interface SiteHeaderData {
  logoText: string
  logoMediaId: string
  ctaText: string
  ctaUrl: string
}

export interface FooterLink { label: string; url: string }
export interface FooterColumn { heading: string; links: FooterLink[] }
export interface SiteFooterData {
  tagline: string
  copyright: string
  columns: FooterColumn[]
}

/** A node in the navigation tree the frontend assembles from the flat page list. */
export interface NavNode {
  id: string
  label: string
  href: string
  children: NavNode[]
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

/** Fetch a CMS global by type name. Returns null on 404 / unreachable so callers degrade gracefully. */
export async function getGlobal(name: string, locale = 'en'): Promise<Global | null> {
  try {
    const res = await fetch(`${CMS_BASE}/api/globals/${encodeURIComponent(name)}?locale=${encodeURIComponent(locale)}`)
    if (!res.ok) return null
    return (await res.json()) as Global
  } catch {
    return null
  }
}

export async function getSiteHeader(locale = 'en'): Promise<SiteHeaderData | null> {
  const g = await getGlobal('SiteHeader', locale)
  if (!g) return null
  return {
    logoText: g.data.logoText ?? '',
    logoMediaId: g.data.logoMediaId ?? '',
    ctaText: g.data.ctaText ?? '',
    ctaUrl: g.data.ctaUrl ?? '',
  }
}

export async function getSiteFooter(locale = 'en'): Promise<SiteFooterData | null> {
  const g = await getGlobal('SiteFooter', locale)
  if (!g) return null
  const columns = (g.blockAreas['columns'] ?? []).map<FooterColumn>((b) => ({
    heading: b.data.heading ?? '',
    links: parseLinks(b.data.links),
  }))
  return { tagline: g.data.tagline ?? '', copyright: g.data.copyright ?? '', columns }
}

function parseLinks(raw: string | undefined): FooterLink[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw) as Array<{ label?: string; url?: string }>
    return Array.isArray(arr)
      ? arr.map((l) => ({ label: l.label ?? '', url: l.url ?? '' })).filter((l) => l.label && l.url)
      : []
  } catch {
    return []
  }
}

/**
 * Build the navigation tree from the flat page list. Nav metadata rides in each page's `data`
 * (showInNavigation / navLabel / navOrder). Filters to navigable pages, orders siblings by navOrder,
 * labels from navLabel||name, hrefs from slug ('' → '/'). Tolerant of the fields being absent.
 */
export async function getNavTree(locale = 'en'): Promise<NavNode[]> {
  let pages: Page[]
  try {
    pages = await fetchPages(locale)
  } catch {
    return []
  }
  const visible = pages.filter((p) => p.data.showInNavigation === 'true')
  const visibleIds = new Set(visible.map((p) => p.id))
  const order = (p: Page) => parseInt(p.data.navOrder ?? '0', 10) || 0
  const toNode = (p: Page): NavNode => ({
    id: p.id,
    label: (p.data.navLabel || p.name).trim(),
    href: p.slug === '' ? '/' : `/${p.slug}`,
    children: visible
      .filter((c) => c.parentId === p.id)
      .sort((a, b) => order(a) - order(b))
      .map(toNode),
  })
  // Roots: navigable pages with no parent, or whose parent isn't itself navigable.
  return visible
    .filter((p) => p.parentId === null || !visibleIds.has(p.parentId))
    .sort((a, b) => order(a) - order(b))
    .map(toNode)
}
