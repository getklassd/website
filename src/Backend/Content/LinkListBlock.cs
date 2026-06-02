using Klassd.Core.Abstractions;

namespace GetKlassd.Cms.Content;

/// <summary>One footer column: a heading plus a list of links. Links are stored as a JSON string
/// (block field data is string-keyed); the frontend parses it (see api.ts parseLinks).</summary>
public class LinkListBlock : BlockBase
{
    [Localized] public string Heading { get; set; } = "";

    /// <summary>JSON array of <c>{ "label", "url" }</c> objects.</summary>
    [Localized] public string Links { get; set; } = "";
}
