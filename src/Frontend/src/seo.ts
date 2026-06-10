// Per-route SEO: title, description, canonical and social-card tags. The home page's <head> used to
// be static in index.html, so /docs and /workflows inherited its title/description/OG — bad for
// search and link unfurls. render() now resolves the route to one of these and bakes the head tags
// into the <!--ssr-head--> placeholder (server-side and at prerender), so each view stands alone.

const SITE = 'https://getklassd.com'
const OG_IMAGE = `${SITE}/og.png`

export interface Seo {
  /** Route path this entry describes (also the canonical/og:url path). */
  path: string
  title: string
  description: string
}

const ROUTES: Record<string, Seo> = {
  '/': {
    path: '/',
    title: 'Klassd — code-first headless CMS for .NET',
    description:
      'Klassd is a code-first, headless CMS for .NET. Define your content model as C# classes and deliver it to any frontend over a clean JSON API.',
  },
  '/docs': {
    path: '/docs',
    title: 'Docs — Klassd, the code-first headless CMS for .NET',
    description:
      'Build a headless CMS in C#: quickstart, content types and property types, editorial features, the delivery API, and how Klassd compares to Umbraco and Payload.',
  },
  '/workflows': {
    path: '/workflows',
    title: 'Klassd.Workflows — code-first background jobs & workflows for .NET',
    description:
      'Klassd.Workflows is a code-first background-job and DAG workflow engine for .NET. Define jobs as C# classes, run each as its own Kubernetes pod, and compose them into workflows.',
  },
}

/** Resolve a route to its SEO entry, falling back to the home page. */
export function seoFor(route: string): Seo {
  return ROUTES[route] ?? ROUTES['/']
}

/** Escape a value for safe interpolation into an HTML attribute / element. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Build the per-route <head> markup injected at the <!--ssr-head--> placeholder. */
export function renderHead(route: string): string {
  const seo = seoFor(route)
  const url = `${SITE}${seo.path}`
  const title = esc(seo.title)
  const description = esc(seo.description)

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Klassd" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
  ].join('\n    ')
}
