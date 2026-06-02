using GetKlassd.Cms;
using Klassd.Abstractions.Media;
using Klassd.Backoffice;
using Klassd.Cache.InMemory;
using Klassd.Data.Sqlite;
using Klassd.Media.FileSystem;

var builder = WebApplication.CreateBuilder(args);

// ── Klassd, headless ──────────────────────────────────────────────────
// This host is the CMS only: it serves the Blazor admin at /admin and the public JSON
// delivery API at /api. The getklassd.com frontend (src/Frontend) is a separate Vue app
// that reads /api — the CMS renders no public HTML itself.
builder.Services
    .AddKlassd(builder.Configuration)
    .UseSqlite(builder.Configuration.GetSection("Sqlite"))
    .UseInMemoryCache()
    .AddMedia(media =>
    {
        media.AddSection("images", s => s
            .UseFileSystem(Path.Combine(builder.Environment.ContentRootPath, "media", "images"))
            .AllowContentTypes("image/*")
            .ResizeImages(2000));
    });

var app = builder.Build();

app.UseKlassd();   // auth + antiforgery + storage init + admin seed + static assets + /api + /admin

// Seed a starter HomePage so the frontend has something to render on first run.
await StarterContent.SeedAsync(app.Services);

app.Run();
