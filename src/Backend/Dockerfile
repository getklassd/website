# CMS host (ASP.NET 10) — Blazor admin at /admin + headless JSON API at /api.
# Build context MUST be the repo root: the .csproj references the Klassd engine via the
# `klassd/` submodule, so build with:  docker build -f src/Backend/Dockerfile .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Engine sources (ProjectReference targets) + this host.
COPY klassd/ klassd/
COPY src/Backend/ src/Backend/

RUN dotnet restore src/Backend/GetKlassd.Cms.csproj
RUN dotnet publish src/Backend/GetKlassd.Cms.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

# Persist the SQLite database (and let media default under the app dir). Mount a volume at /data.
ENV Sqlite__ConnectionString="Data Source=/data/getklassd.db" \
    ASPNETCORE_URLS=http://+:5080 \
    DOTNET_NOLOGO=true
VOLUME ["/data"]
EXPOSE 5080
ENTRYPOINT ["dotnet", "GetKlassd.Cms.dll"]
