using Klassd.Core.Abstractions;

namespace GetKlassd.Cms.Content;

/// <summary>
/// Site-wide header chrome (singleton global). Delivered at <c>/api/globals/SiteHeader</c>.
/// The Vue frontend renders the logo + CTA from these fields; the nav links come from the page
/// tree (pages with ShowInNavigation), not from here.
/// </summary>
[CmsGlobal(DisplayName = "Site Header")]
public class SiteHeader : GlobalBase
{
    [Localized] public string LogoText { get; set; } = "";

    /// <summary>Optional media item id (images section); falls back to LogoText when empty.</summary>
    [CmsField(FieldType = "media")] public string LogoMediaId { get; set; } = "";

    [Localized] public string CtaText { get; set; } = "";
    public string CtaUrl { get; set; } = "";
}
