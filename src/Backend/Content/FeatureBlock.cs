using Klassd.Core.Abstractions;

namespace GetKlassd.Cms.Content;

/// <summary>A single feature card on the landing page.</summary>
public class FeatureBlock : BlockBase
{
    [Localized] public string Title { get; set; } = "";
    [Localized] public string Body { get; set; } = "";
}
