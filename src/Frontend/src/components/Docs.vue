<script setup lang="ts">
// Static documentation view. Content lives here (not in the CMS) so the docs are versioned with
// the framework and render with zero CMS dependency — they prerender into /docs/index.html.

interface FieldType {
  alias: string
  clr: string
  declare: string
  notes: string
}

// Built-in property types — mirrors Klassd.Core PropertyTypes/Defaults/DefaultPropertyTypes.
const fieldTypes: FieldType[] = [
  { alias: 'text', clr: 'string', declare: 'public string Title { get; set; } = "";', notes: 'Default for string. Single-line text input.' },
  { alias: 'textarea', clr: '— (opt-in)', declare: '[CmsField(FieldType = "textarea")]\npublic string Body { get; set; } = "";', notes: 'Multi-line text. Opt in on a string via [CmsField].' },
  { alias: 'number', clr: 'int, long', declare: 'public int Order { get; set; }', notes: 'Default for int and long. Numeric input.' },
  { alias: 'checkbox', clr: 'bool', declare: 'public bool Featured { get; set; }', notes: 'Default for bool. Toggle.' },
  { alias: 'datetime-local', clr: 'DateTime', declare: 'public DateTime PublishedAt { get; set; }', notes: 'Default for DateTime. Date + time picker.' },
  { alias: 'blocks', clr: 'BlockArea', declare: 'public BlockArea PageBlocks { get; set; } = new();', notes: 'A named, schedulable area of block instances. Declare one property per area.' },
  { alias: 'media', clr: 'MediaReference', declare: 'public MediaReference Image { get; set; } = new();', notes: 'Media picker; stores the media item id. A string with [CmsField(FieldType = "media")] also works.' },
  { alias: 'relationship', clr: 'PageReference', declare: '[AllowedRelations(typeof(ArticlePage))]\npublic PageReference Related { get; set; } = new();', notes: 'Page picker; stores the target page’s ContentId. Restrict targets with [AllowedRelations]; omit for any page type.' },
  { alias: 'richtext', clr: '— (opt-in)', declare: '[CmsField(FieldType = "richtext")]\npublic string Body { get; set; } = "";', notes: 'Rich text editor (Quill); stores HTML.' },
  { alias: 'email / url / color', clr: '— (opt-in)', declare: '[CmsField(FieldType = "email")]\npublic string Contact { get; set; } = "";', notes: 'HTML5 email / URL / colour inputs. Opt in on a string via [CmsField].' },
  { alias: 'decimal', clr: 'decimal, double, float', declare: 'public decimal Price { get; set; }', notes: 'Fractional number input.' },
  { alias: 'date / time', clr: 'DateOnly / TimeOnly', declare: 'public DateOnly Released { get; set; }', notes: 'Date-only / time-only pickers.' },
]

interface AttrDoc { name: string; target: string; options: string; desc: string }

const attributes: AttrDoc[] = [
  { name: '[CmsPage]', target: 'page class', options: 'DefaultSlug, Icon', desc: 'Page metadata. DefaultSlug null = auto from name, "" = root. Icon = a built-in icon name ("house", "folder", "file"…) or any emoji; shows in the admin tree.' },
  { name: '[CmsGlobal]', target: 'class', options: '—', desc: 'Marks a singleton content type (site chrome like a header/footer) rather than a tree page.' },
  { name: '[AllowedChildren]', target: 'page class', options: 'params Type[]', desc: 'Restrict child page types. Absent = any; empty = none; with types = only those.' },
  { name: '[CmsField]', target: 'property', options: 'DisplayName, FieldType', desc: 'Override the editor label or force a property type alias (e.g. "textarea", "media", "relationship").' },
  { name: '[AllowedRelations]', target: 'property', options: 'params Type[]', desc: 'For relationship fields: which page types the picker lists. Absent or empty = any page type.' },
  { name: '[Localized]', target: 'property', options: '—', desc: 'This field gets a separate value per locale.' },
  { name: '[LocalizedPage]', target: 'page class', options: '—', desc: 'Every field on the page is localized.' },
  { name: '[Indexable]', target: 'property', options: '—', desc: 'Create a database index for this field (cross-adapter).' },
]

const installCode = `dotnet add package Klassd.Backoffice --prerelease
dotnet add package Klassd.Data.Sqlite --prerelease`

const contentCode = `using Klassd.Core.Abstractions;

[CmsPage(DefaultSlug = "", Icon = "house")]
[AllowedChildren(typeof(ArticlePage))]
public class HomePage : PageBase
{
    [Localized]                          // separate value per locale
    public string Title { get; set; } = "";
    public string SubTitle { get; set; } = "";
    public BlockArea HeroBlocks { get; set; } = new();
}

public class ArticlePage : PageBase
{
    public string Title { get; set; } = "";

    [CmsField(FieldType = "textarea")]
    public string Body { get; set; } = "";

    public MediaReference Hero { get; set; } = new();

    [AllowedRelations(typeof(ArticlePage))]
    public PageReference Related { get; set; } = new();
}`

const wireCode = `var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddKlassd(builder.Configuration)                       // discovers your content types
    .UseSqlite(builder.Configuration.GetSection("Sqlite"))  // or .UseMongoDb / .UsePostgres
    .UseInMemoryCache();                                    // optional read-through cache

var app = builder.Build();
app.UseKlassd();   // auth + antiforgery + seed/init + static assets + /api + Blazor admin
app.Run();`

const editorCode = `@attribute [PropertyEditor("color")]
@inherits PropertyEditorBase

<input type="color" value="@Value"
       @oninput="e => SetValueAsync(e.Value?.ToString() ?? string.Empty)" />`

const useEditorCode = `[CmsField(FieldType = "color")]
public string BackgroundColor { get; set; } = "";`

const sections = [
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'content-types', label: 'Content types' },
  { id: 'property-types', label: 'Property types' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'capabilities', label: 'Editorial features' },
  { id: 'extend', label: 'Extending' },
  { id: 'delivery', label: 'Delivery API' },
  { id: 'comparison', label: 'Comparison' },
]

interface Capability { title: string; body: string }
const capabilities: Capability[] = [
  { title: 'Drafts & versioning', body: 'Edits go to a draft — the live page is untouched until you Publish. Full version history with one-click rollback, plus per-page scheduled publishing.' },
  { title: 'Roles & permissions', body: 'Capability-based roles (Administrator / Editor / Author). Authors save drafts; Editors publish. Enforced on the API and reflected in the admin UI.' },
  { title: 'Full-text search', body: 'Opt-in, storage-agnostic Lucene.NET index — tokenized and ranked, kept live via content events and rebuilt from the database on startup.' },
  { title: 'Webhooks & notifications', body: 'HMAC-signed webhooks for content changes, plus synchronous in-process notifications you can hook to mutate or cancel an operation (before/after publish, save, delete).' },
  { title: 'GraphQL (opt-in)', body: 'A read-only GraphQL delivery API over HotChocolate, mirroring the REST endpoints — added as a package, not in core.' },
  { title: 'Caching', body: 'Read-through page cache: in-process, Redis, or an L1+L2 HybridCache tier.' },
]

interface CompareRow { feature: string; klassd: string; umbraco: string; payload: string }
const comparison: CompareRow[] = [
  { feature: 'Code-first schema', klassd: 'C# classes', umbraco: 'UI / database-driven', payload: 'TypeScript config' },
  { feature: 'Admin UI', klassd: 'Blazor (no JS build)', umbraco: 'Web-components SPA', payload: 'React (in your Next.js app)' },
  { feature: 'Drafts & versioning', klassd: 'Yes', umbraco: 'Yes', payload: 'Yes (+ autosave)' },
  { feature: 'Scheduled publishing', klassd: 'Yes', umbraco: 'Yes', payload: 'Yes' },
  { feature: 'Roles & permissions', klassd: 'Capabilities + roles', umbraco: 'User groups', payload: 'Access-as-code' },
  { feature: 'Full-text search', klassd: 'Lucene.NET (opt-in)', umbraco: 'Examine / Lucene', payload: 'Plugin' },
  { feature: 'Webhooks / events', klassd: 'Webhooks + notifications', umbraco: 'Notifications', payload: 'Hooks' },
  { feature: 'REST delivery', klassd: 'Yes', umbraco: 'Yes', payload: 'Yes' },
  { feature: 'GraphQL', klassd: 'Opt-in package', umbraco: 'Cloud (Heartcore) only', payload: 'Core' },
  { feature: 'Storage backends', klassd: 'Mongo / Postgres / SQLite', umbraco: 'SQL Server / SQLite', payload: 'Mongo / Postgres / SQLite' },
  { feature: 'Localization', klassd: 'Per-field + markets', umbraco: 'Culture + segment variants', payload: 'Field-level locales' },
  { feature: 'Runtime / platform', klassd: '.NET (Blazor)', umbraco: '.NET (ASP.NET Core)', payload: 'Node (Next.js)' },
  { feature: 'License', klassd: 'MIT', umbraco: 'MIT', payload: 'MIT' },
]
</script>

<template>
  <div class="docs">
    <aside class="docs-side">
      <nav class="docs-toc" aria-label="Docs sections">
        <p class="docs-toc-title">Documentation</p>
        <a v-for="s in sections" :key="s.id" :href="`#${s.id}`" class="docs-toc-link">{{ s.label }}</a>
        <a href="/docs/api/" class="docs-toc-link docs-toc-api">API reference →</a>
      </nav>
    </aside>

    <article class="docs-body">
      <header class="docs-head">
        <span class="badge">Docs</span>
        <h1>Build a CMS in C#</h1>
        <p class="docs-lede">
          Klassd is a code-first, headless CMS for .NET. You define content types — pages, blocks and
          property types — as plain C# classes; the engine reflects over them to drive a Blazor admin
          and a JSON delivery API. No schema migrations, no separate modelling UI.
        </p>
        <p class="docs-lede-meta">
          Prefer type-by-type detail? Browse the
          <a href="/docs/api/">generated API reference →</a>
        </p>
      </header>

      <!-- Quickstart -->
      <section id="quickstart" class="docs-section">
        <h2>Quickstart</h2>
        <p>Install the engine plus one storage adapter. While Klassd is in beta the packages are prerelease:</p>
        <pre class="docs-code"><code>{{ installCode }}</code></pre>

        <h3>1. Define content types</h3>
        <p>Any class deriving from <code>PageBase</code> or <code>BlockBase</code> in your app is discovered automatically:</p>
        <pre class="docs-code"><code>{{ contentCode }}</code></pre>

        <h3>2. Wire it up in <code>Program.cs</code></h3>
        <pre class="docs-code"><code>{{ wireCode }}</code></pre>
        <p class="docs-note">
          <strong>Host <code>.csproj</code>:</strong> a host with no <code>.razor</code> files of its own must set
          <code>&lt;RequiresAspNetWebAssets&gt;true&lt;/RequiresAspNetWebAssets&gt;</code>, or <code>/admin</code>
          404s on <code>blazor.web.js</code>. (If your host already has <code>.razor</code> files the SDK turns this on for you.)
        </p>

        <h3>3. Run</h3>
        <p>Open <code>/admin</code> to author content. Your frontend reads published content from <code>/api/pages</code>.</p>
      </section>

      <!-- Content types -->
      <section id="content-types" class="docs-section">
        <h2>Content types</h2>
        <ul class="docs-list">
          <li><strong>Pages</strong> — derive from <code>PageBase</code>. Live in a tree (parent/child), have a slug, and are delivered at <code>/api/pages</code>.</li>
          <li><strong>Blocks</strong> — derive from <code>BlockBase</code>. Reusable content components placed into a page's <code>BlockArea</code> properties; each can be scheduled with a publish window.</li>
          <li><strong>Globals</strong> — annotate with <code>[CmsGlobal]</code>. Singletons for site chrome (header, footer) — exactly what this website uses.</li>
        </ul>
        <p>Every <code>public</code> property becomes an editable field. The editor for a field is chosen from its CLR type (see below) or an explicit <code>[CmsField(FieldType = "…")]</code>.</p>
      </section>

      <!-- Property types -->
      <section id="property-types" class="docs-section">
        <h2>Built-in property types</h2>
        <p>Each field maps to a property type by its CLR type, or you can force one with <code>[CmsField(FieldType = "alias")]</code>.</p>
        <div class="docs-table-wrap">
          <table class="docs-table">
            <thead>
              <tr><th>Alias</th><th>CLR type</th><th>Declare it</th><th>Notes</th></tr>
            </thead>
            <tbody>
              <tr v-for="f in fieldTypes" :key="f.alias">
                <td><code class="docs-alias">{{ f.alias }}</code></td>
                <td><code>{{ f.clr }}</code></td>
                <td><pre class="docs-cell-code"><code>{{ f.declare }}</code></pre></td>
                <td>{{ f.notes }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Media options</h3>
        <p>Media is organised into named <strong>sections</strong>, each backed by its own blob adapter (FileSystem / S3 / Google Cloud). Configure with <code>.AddMedia(...)</code>:</p>
        <ul class="docs-list">
          <li><code>UseFileSystem(path)</code> / <code>UseS3(...)</code> / <code>UseGoogleCloudStorage(...)</code> — pick a backend per section.</li>
          <li><code>AllowContentTypes("image/*", "application/pdf")</code> — restrict uploads.</li>
          <li><code>ResizeImages(maxEdgePixels)</code> — downscale in the browser before upload.</li>
          <li><code>Breakpoints("default", "mobile", "tablet")</code> — focal-point editors the admin offers.</li>
        </ul>

        <h3>Relationship options</h3>
        <ul class="docs-list">
          <li>Declare a <code>PageReference</code> property (or <code>[CmsField(FieldType = "relationship")]</code> on a string).</li>
          <li><code>[AllowedRelations(typeof(ArticlePage), …)]</code> — restrict which page types appear in the picker. Omit for any type.</li>
          <li>Stores the target's <strong>ContentId</strong> (locale-agnostic) — resolve from the frontend via <code>GET /api/pages/content/{contentId}</code>, then pick the translation for the locale you're rendering.</li>
        </ul>
      </section>

      <!-- Attributes -->
      <section id="attributes" class="docs-section">
        <h2>Attributes reference</h2>
        <div class="docs-table-wrap">
          <table class="docs-table">
            <thead>
              <tr><th>Attribute</th><th>Applies to</th><th>Options</th><th>Effect</th></tr>
            </thead>
            <tbody>
              <tr v-for="a in attributes" :key="a.name">
                <td><code class="docs-alias">{{ a.name }}</code></td>
                <td>{{ a.target }}</td>
                <td><code>{{ a.options }}</code></td>
                <td>{{ a.desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Editorial features -->
      <section id="capabilities" class="docs-section">
        <h2>Editorial features</h2>
        <p>Beyond the content model, the engine ships the workflow features editors expect:</p>
        <div class="docs-cards">
          <div v-for="c in capabilities" :key="c.title" class="docs-card">
            <h3>{{ c.title }}</h3>
            <p>{{ c.body }}</p>
          </div>
        </div>
      </section>

      <!-- Extending -->
      <section id="extend" class="docs-section">
        <h2>Extending Klassd</h2>

        <h3>Custom property editors</h3>
        <p>
          A custom field editor is a single Blazor component — no JS, no registration. Inherit
          <code>PropertyEditorBase</code> and mark it with <code>[PropertyEditor("alias")]</code>; the engine
          discovers it by assembly scan and synthesises the property type for you.
        </p>
        <pre class="docs-code"><code>{{ editorCode }}</code></pre>
        <p>Then reference the alias from any field:</p>
        <pre class="docs-code"><code>{{ useEditorCode }}</code></pre>
        <p>
          <code>PropertyEditorBase</code> gives you <code>Value</code> (string), <code>ValueChanged</code> and the
          field metadata. The stored value is always a string — content is persisted DB-agnostically — and
          <code>MediaReference</code> / <code>PageReference</code> are typed wrappers over that string.
        </p>

        <h3>Custom storage &amp; media adapters</h3>
        <p>
          Storage and media backends are swappable. The engine depends only on interfaces in
          <code>Klassd.Abstractions</code> — never a concrete database or cloud SDK. Implement
          <code>IPageStore</code> / <code>IMediaStore</code> (storage) or <code>IBlobStore</code> (media) and add a
          <code>UseXxx</code> registration extension. Worked examples ship in the
          <a href="https://github.com/getklassd/Klassd/tree/main/examples">examples/</a> folder.
        </p>
      </section>

      <!-- Delivery -->
      <section id="delivery" class="docs-section">
        <h2>Delivery API</h2>
        <p>The headless GET endpoints are anonymous so a public frontend can read published content (this site consumes them):</p>
        <ul class="docs-list">
          <li><code>GET /api/pages</code> — all pages for a locale (<code>?locale=en</code>).</li>
          <li><code>GET /api/pages/{id}</code> — a single page.</li>
          <li><code>GET /api/pages/by-slug/{**slug}</code> — a page by its slug (<code>?locale=en</code>).</li>
          <li><code>GET /api/pages/content/{contentId}</code> — a page and its translations (resolve relationships here).</li>
          <li><code>GET /api/pages/{id}/translations</code> — every locale of one page.</li>
          <li><code>GET /api/globals/{name}</code> — a global singleton (e.g. <code>SiteHeader</code>).</li>
          <li><code>GET /api/media/{id}</code> — a media item's bytes.</li>
        </ul>
        <p>
          Only <strong>published</strong>, in-window content is delivered. Single-page GETs accept
          <code>?depth=1</code> to resolve <code>PageReference</code>/<code>MediaReference</code> fields to URLs
          and <code>?expand=</code> to pick which. Scheduling resolves per request; <code>?preview=&lt;utc&gt;</code>
          time-travels delivery when enabled. A <code>/graphql</code> endpoint is available via the opt-in GraphQL package.
        </p>
        <p class="docs-cta-row">
          <a class="cta" href="/docs/api/">API reference</a>
          <a class="docs-ghost" href="https://github.com/getklassd/Klassd">View on GitHub</a>
          <a class="docs-ghost" href="https://www.nuget.org/packages/Klassd.Backoffice">NuGet packages</a>
        </p>
      </section>

      <!-- Comparison -->
      <section id="comparison" class="docs-section">
        <h2>Klassd vs Umbraco vs Payload</h2>
        <p>How Klassd's code-first, .NET-native approach compares to two popular headless CMSs. All three are open-source (MIT).</p>
        <div class="docs-table-wrap">
          <table class="docs-table">
            <thead>
              <tr><th>Feature</th><th>Klassd</th><th>Umbraco</th><th>Payload</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in comparison" :key="r.feature">
                <td>{{ r.feature }}</td>
                <td>{{ r.klassd }}</td>
                <td>{{ r.umbraco }}</td>
                <td>{{ r.payload }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="docs-note">
          Klassd's niche: true code-first content modelling in C#, a Blazor admin with no JS build step, and
          pluggable storage — shipped as NuGet packages you compose. Comparison reflects each project's
          core/open-source offering as of 2026.
        </p>
      </section>
    </article>
  </div>
</template>
