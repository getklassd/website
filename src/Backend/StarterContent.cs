using GetKlassd.Cms.Content;
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
    }
}
