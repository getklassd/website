using Klassd.Core.Abstractions;

namespace GetKlassd.Cms.Content;

/// <summary>Site-wide footer chrome (singleton global). Delivered at <c>/api/globals/SiteFooter</c>.</summary>
[CmsGlobal(DisplayName = "Site Footer")]
public class SiteFooter : GlobalBase
{
    [Localized] public string Tagline { get; set; } = "";
    [Localized] public string Copyright { get; set; } = "";

    /// <summary>Footer link columns, authored as <see cref="LinkListBlock"/> blocks.</summary>
    public BlockArea Columns { get; set; } = new();
}
