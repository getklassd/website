using Klassd.Core.Abstractions;

namespace GetKlassd.Cms.Content;

/// <summary>
/// The getklassd.com landing page. Defined as a C# class — the Klassd engine reflects over it to
/// drive the admin editor, and the headless frontend reads these fields back via <c>/api/pages</c>.
/// </summary>
[CmsPage(DefaultSlug = "")]
public class HomePage : PageBase
{
    [Localized] public string HeroTitle { get; set; } = "";
    [Localized] public string HeroSubtitle { get; set; } = "";

    public string CtaText { get; set; } = "";
    public string CtaUrl { get; set; } = "";

    /// <summary>The "why Klassd" feature cards, authored as blocks.</summary>
    public BlockArea Features { get; set; } = new();
}
