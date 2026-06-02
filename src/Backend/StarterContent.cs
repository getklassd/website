using GetKlassd.Cms.Content;
using Klassd.Backoffice.Modules.Globals.Services;
using Klassd.Backoffice.Modules.Pages.Models;
using Klassd.Backoffice.Modules.Pages.Services;
using Klassd.Core.Localization;

namespace GetKlassd.Cms;

/// <summary>
/// Seeds a starter <see cref="HomePage"/> on first run so the headless frontend has content to
/// render immediately. Idempotent — does nothing once a HomePage exists (edit it in <c>/admin</c>).
/// </summary>
public static class StarterContent
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;

        var registry = sp.GetRequiredService<LocaleRegistry>();
        var locale = registry.All.FirstOrDefault(l => l.Mandatory)?.Code
                     ?? registry.All.FirstOrDefault()?.Code
                     ?? "en";

        var pages = sp.GetRequiredService<PageService>();
        var existing = await pages.GetByLocaleAsync(locale);
        if (existing.Any(p => p.PageTypeName == nameof(HomePage)))
            return;

        await pages.CreateAsync(new CreatePageRequest(
            PageTypeName: nameof(HomePage),
            LocaleCode: locale,
            ContentId: null,
            ParentId: null,
            Name: "Home",
            Slug: "",
            // Keys are the camelCase field names the engine uses (see ContentTypeRegistry).
            Data: new Dictionary<string, string>
            {
                ["heroTitle"] = "Code-first content, no compromises",
                ["heroSubtitle"] = "Klassd is a headless CMS for .NET. Define your content model as C# classes and deliver it to any frontend over a clean JSON API.",
                ["ctaText"] = "Get started on GitHub",
                ["ctaUrl"] = "https://github.com/getklassd/Klassd",
                // Navigation metadata (PageBase) — drives the site menu built from the page tree.
                ["showInNavigation"] = "true",
                ["navLabel"] = "Home",
                ["navOrder"] = "0",
            },
            BlockAreas: new Dictionary<string, List<BlockData>>
            {
                ["features"] =
                [
                    new BlockData(nameof(FeatureBlock), new() { ["title"] = "Code-first", ["body"] = "Your content types are C# classes. Refactor them in your IDE — no content-type designer." }),
                    new BlockData(nameof(FeatureBlock), new() { ["title"] = "Headless", ["body"] = "A public JSON delivery API any frontend can read — this site is a Vue app consuming it." }),
                    new BlockData(nameof(FeatureBlock), new() { ["title"] = "Pluggable", ["body"] = "Swap storage (Mongo/Postgres/SQLite) and media (FileSystem/S3/GCS) backends freely." }),
                ],
            }));

        // A second page so the page-tree-driven nav shows more than one item on first run.
        await pages.CreateAsync(new CreatePageRequest(
            PageTypeName: nameof(HomePage), LocaleCode: locale, ContentId: null, ParentId: null,
            Name: "Docs", Slug: "docs",
            Data: new Dictionary<string, string>
            {
                ["heroTitle"] = "Documentation",
                ["heroSubtitle"] = "Guides and API reference for Klassd live on GitHub.",
                ["ctaText"] = "Read the docs",
                ["ctaUrl"] = "https://github.com/getklassd/Klassd#readme",
                ["showInNavigation"] = "true",
                ["navLabel"] = "Docs",
                ["navOrder"] = "1",
            },
            BlockAreas: new()));

        // Seed the site chrome globals (header + footer). First-run only (gated with the HomePage check above).
        var globals = sp.GetRequiredService<GlobalService>();

        await globals.SaveAsync(nameof(SiteHeader), locale,
            new Dictionary<string, string>
            {
                ["logoText"] = "Klassd",
                ["ctaText"] = "GitHub",
                ["ctaUrl"] = "https://github.com/getklassd/Klassd",
            },
            blockAreas: null);

        await globals.SaveAsync(nameof(SiteFooter), locale,
            new Dictionary<string, string>
            {
                ["tagline"] = "A code-first, headless CMS for .NET.",
                ["copyright"] = $"© {DateTime.UtcNow.Year} Klassd",
            },
            new Dictionary<string, List<BlockData>>
            {
                ["columns"] =
                [
                    new BlockData(nameof(LinkListBlock), new()
                    {
                        ["heading"] = "Project",
                        ["links"] = """[{"label":"GitHub","url":"https://github.com/getklassd/Klassd"},{"label":"Docs","url":"/docs"}]""",
                    }),
                    new BlockData(nameof(LinkListBlock), new()
                    {
                        ["heading"] = "Built with",
                        ["links"] = """[{"label":"Claude Code","url":"https://claude.com/claude-code"}]""",
                    }),
                ],
            });
    }
}
