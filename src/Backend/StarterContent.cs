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
                // "See it in code" showcase below the feature cards.
                ["codeHeading"] = "Your content model is just C#",
                ["codeSubtitle"] = "Define pages and blocks as classes. The engine reflects over them to drive the admin and a headless JSON API — no content-type designer, no migrations to hand-write.",
                ["codeSample"] =
                    """
                    [CmsPage(DefaultSlug = "", Icon = "house")]
                    public class HomePage : PageBase
                    {
                        [Localized]   // value per locale
                        public string Title { get; set; } = "";

                        public BlockArea Hero { get; set; } = new();
                    }
                    """,
                ["installCommand"] =
                    """
                    # Klassd is in beta — install the prerelease packages
                    dotnet add package Klassd.Backoffice --prerelease
                    dotnet add package Klassd.Data.Sqlite --prerelease
                    """,
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

        // Seed the site chrome globals (header + footer). First-run only (gated with the HomePage check above).
        var globals = sp.GetRequiredService<GlobalService>();

        await globals.SaveAsync(nameof(SiteHeader), locale,
            new Dictionary<string, string>
            {
                ["logoText"] = "Klassd",
                // Primary nav: on-site docs + a link out to the GitHub repo.
                ["navLinks"] = """[{"label":"Docs","url":"/docs"},{"label":"GitHub","url":"https://github.com/getklassd/Klassd"}]""",
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
                        ["links"] = """[{"label":"GitHub","url":"https://github.com/getklassd/Klassd"},{"label":"Docs","url":"/docs"},{"label":"NuGet","url":"https://www.nuget.org/packages/Klassd.Backoffice"}]""",
                    }),
                ],
            });
    }
}
