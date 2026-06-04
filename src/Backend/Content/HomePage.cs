using Klassd.Core.Abstractions;

namespace GetKlassd.Cms.Content;

/// <summary>
/// The getklassd.com landing page. Defined as a C# class — the Klassd engine reflects over it to
/// drive the admin editor, and the headless frontend reads these fields back via <c>/api/pages</c>.
/// </summary>
[CmsPage(DefaultSlug = "")]
public class HomePage : PageBase
{
    [Localized, Indexable] public string HeroTitle { get; set; } = "";
    [Localized, Indexable] public string HeroSubtitle { get; set; } = "";

    public string CtaText { get; set; } = "";
    public string CtaUrl { get; set; } = "";

    /// <summary>The "why Klassd" feature cards, authored as blocks.</summary>
    public BlockArea Features { get; set; } = new();

    // ── "See it in code" showcase ─────────────────────────────────────────
    // A code sample + install snippet so the landing page shows substance below
    // the fold. Rendered by the frontend's CodeShowcase component when present.
    [Localized] public string CodeHeading { get; set; } = "";
    [Localized] public string CodeSubtitle { get; set; } = "";

    /// <summary>A C# snippet shown verbatim (rendered in a &lt;pre&gt;).</summary>
    public string CodeSample { get; set; } = "";

    /// <summary>The shell commands to install Klassd (rendered in a &lt;pre&gt;).</summary>
    public string InstallCommand { get; set; } = "";
}
