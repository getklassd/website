using Klassd.Core.Abstractions;

namespace GetKlassd.Cms.Content;

/// <summary>
/// Site-wide header chrome (singleton global). Delivered at <c>/api/globals/SiteHeader</c>.
/// The Vue frontend renders the logo, primary nav links and CTA from these fields.
/// </summary>
[CmsGlobal(DisplayName = "Site Header")]
public class SiteHeader : GlobalBase
{
    [Localized] public string LogoText { get; set; } = "";

    /// <summary>Optional media item id (images section); falls back to LogoText when empty.</summary>
    [CmsField(FieldType = "media")] public string LogoMediaId { get; set; } = "";

    /// <summary>Primary nav links as a JSON array of <c>{ "label", "url" }</c> objects
    /// (URLs may be internal or external). Parsed by the frontend (see api.ts parseLinks).</summary>
    [Localized] public string NavLinks { get; set; } = "";

    [Localized] public string CtaText { get; set; } = "";
    public string CtaUrl { get; set; } = "";
}
