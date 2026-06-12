<script setup lang="ts">
// Docs for the Klassd.Workflows package. Content lives here (not in the CMS) so it's versioned
// with the site and renders with zero CMS dependency — it prerenders into /workflows/docs/index.html.
// The marketing landing lives at /workflows (Workflows.vue). Reuses the shared `docs-*` styles.

const installCode = `dotnet add package Klassd.Workflows.Core --prerelease
dotnet add package Klassd.Workflows.Storage.Postgres --prerelease   # durable store (or .Storage.MongoDb / .Storage.Sqlite)
dotnet add package Klassd.Workflows.Kubernetes --prerelease         # K8s executor (omit for local only)
dotnet add package Klassd.Workflows.Artifacts.S3 --prerelease       # artifact store (or .Artifacts.Gcs)
dotnet add package Klassd.Workflows.Dashboard --prerelease          # the live UI (Razor Class Library)
dotnet add package Klassd.Workflows.Auth --prerelease               # optional: dashboard users/SSO (+ .Auth.OpenIdConnect)`

const jobCode = `public sealed class MyJob : IJob
{
    public async Task RunAsync(IJobContext ctx)
    {
        ctx.Log("starting");
        ctx.ReportProgress(50, "halfway");
        await Task.Delay(1000, ctx.CancellationToken);
        ctx.Log("done");
    }
}`

const wireCode = `var workflows = builder.Services.AddKlassdWorkflowsCore();
workflows.UsePostgres("Host=…;Database=…;Username=…;Password=…");  // or .UseMongo(...) / in-memory

builder.Services.AddKubernetesExecutor(builder.Configuration);     // or AddLocalExecutor(workerDll)`

const dashboardCode = `builder.Services.AddHttpContextAccessor();        // dashboard reads a theme cookie during SSR
builder.Services.AddKlassdWorkflowsDashboard();   // the Blazor Interactive Server UI

var app = builder.Build();
app.UseAntiforgery();
app.MapKlassdWorkflowsDashboard();                // static assets + component endpoints
app.Run();`

const scheduleCode = `scheduler.AddOrUpdateRecurring<MyJob>("nightly", "0 2 * * *");   // cron
await scheduler.EnqueueAsync<MyJob>();                            // fire now`

const dagCode = `registry.Register(new WorkflowBuilder("catalog-integration")
    .Add<MarketFinderJob>("markets")                       // root: emits "market_ids"
    .Add<DataProxyJob>("data-proxy")                       // parallel root: writes an artifact
    .Add<IntegrationJob>("integration", n => n
        .DependsOn("markets", "data-proxy")
        .FanOutOver("markets", "market_ids", itemArgument: "market"))   // one pod per market
    .Add<PublishJob>("publish", n => n.DependsOn("integration").WithRetries(2))
    .Add<FinalizerJob>("finalizer", n => n
        .DependsOn("publish", "data-proxy")
        .BindInput("dataset_ref", "data-proxy", "dataset_ref"))          // reads the artifact
    .Build());`

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'workflows', label: 'Workflows (DAGs)' },
  { id: 'containers', label: 'Container jobs & services' },
  { id: 'executors', label: 'Executors' },
  { id: 'storage', label: 'Storage & artifacts' },
  { id: 'auth', label: 'Dashboard auth' },
  { id: 'packages', label: 'Packages' },
]

const containerNodeCode = `registry.Register(new WorkflowBuilder("cloud-sql-integration")
    .AddContainer("sql-proxy", "gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.11.0", c => c
        .WithArgs("--address=0.0.0.0", "--port=5432", "my-project:region:instance")
        .ServicePort(5432).ReadyOnTcp(5432)
        .AsService())                                   // long-running; torn down at the end
    .Add<IntegrationJob>("integration", n => n
        .DependsOn("sql-proxy")
        .BindInput("db_host", "sql-proxy", "address"))  // <podIP>:5432 forwarded to the job
    .Build());`

const containerJobCode = `// Run an existing image as a standalone job — no IJob port needed.
containerJobs.Register(new ContainerJobDefinition
{
    Name = "legacy-importer",
    Container = new ContainerSpec { Image = "ghcr.io/acme/go-importer:1.4", Args = ["--full"] },
});
await scheduler.EnqueueContainerAsync("legacy-importer",
    new ContainerSpec { Image = "ghcr.io/acme/go-importer:1.4" });`

const authCode = `builder.Services.AddKlassdWorkflowsAuth(o =>
{
    o.SeedAdminEmail = config["Auth:SeedAdmin:Email"];        // first admin on a fresh deploy
    o.SeedAdminPassword = config["Auth:SeedAdmin:Password"];
});
builder.Services.AddKlassdWorkflowsOpenIdConnect("Company SSO", config.GetSection("Oidc"));  // optional

var app = builder.Build();
app.UseKlassdWorkflowsAuth();        // loopback (local dev / kubectl port-forward) is bypassed
app.MapKlassdWorkflowsDashboard();`

interface Feature { title: string; body: string }
const features: Feature[] = [
  { title: 'Code-first jobs', body: 'A job is a C# class implementing IJob — no attributes-as-config, no YAML. The engine discovers it by type name.' },
  { title: 'Runs in its own pod', body: 'Each execution is a batch/v1 Kubernetes Job (one pod), with per-job CPU/memory requests and limits resolved from attribute + config.' },
  { title: 'Same worker, local too', body: 'In dev the same worker runs as a child process — no cluster needed. Switch to Kubernetes with one config setting.' },
  { title: 'DAG workflows', body: 'Compose jobs into a graph: dependencies, fan-out (one pod per item), conditional nodes, retries, and artifact passing between nodes.' },
  { title: 'Run any container', body: 'Run an arbitrary container image as a standalone job or a DAG node — not just IJob classes. Bring legacy tools (a Go binary, anything) without porting them.' },
  { title: 'Service (daemon) nodes', body: 'Long-running sidecars like cloud-sql-proxy: a node comes up, forwards its address to dependents, stays up while they run, and is torn down when the workflow ends.' },
  { title: 'Live dashboard', body: 'A Blazor Server UI — jobs catalog, run history, per-job console with inline progress bars, and an SVG view of each DAG run. Ships as a Razor Class Library you mount into your own host.' },
  { title: 'Dashboard SSO & users', body: 'Email/password users plus OpenID Connect single sign-on, mirroring the Klassd CMS. Loopback (local dev / kubectl port-forward) is bypassed, so no login there.' },
  { title: 'Durable & pluggable', body: 'Swap the job store (in-memory / PostgreSQL / MongoDB / SQLite) and the artifact store (filesystem / S3 / GCS) — or ship your own adapter.' },
]

interface Pkg { id: string; purpose: string }
const packages: Pkg[] = [
  { id: 'Klassd.Workflows.Abstractions', purpose: 'The contract jobs implement: IJob, IJobContext, the IArtifactStore seam, and the worker stdout protocol. No dependencies.' },
  { id: 'Klassd.Workflows.Core', purpose: 'Scheduler, in-memory store, cron recurring loop (Cronos), job catalog, DAG orchestrator, filesystem artifact store, and the local-process executor.' },
  { id: 'Klassd.Workflows.Kubernetes', purpose: 'KubernetesJobExecutor — creates a batch/v1 Job per run and tails the pod logs. AddKubernetesExecutor().' },
  { id: 'Klassd.Workflows.Storage.Postgres', purpose: 'Durable IJobStore (+ dashboard user store) on PostgreSQL (jsonb documents + append-only logs). WorkflowsBuilder.UsePostgres().' },
  { id: 'Klassd.Workflows.Storage.MongoDb', purpose: 'Durable IJobStore (+ dashboard user store) on MongoDB. WorkflowsBuilder.UseMongo().' },
  { id: 'Klassd.Workflows.Storage.Sqlite', purpose: 'Durable IJobStore (+ dashboard user store) in a single SQLite file — zero infrastructure for single-node deployments. WorkflowsBuilder.UseSqlite().' },
  { id: 'Klassd.Workflows.Artifacts.S3', purpose: 'IArtifactStore on S3 / S3-compatible stores (provider name "s3") for large payloads passed between nodes.' },
  { id: 'Klassd.Workflows.Artifacts.Gcs', purpose: 'IArtifactStore on Google Cloud Storage (provider name "gcs").' },
  { id: 'Klassd.Workflows.Dashboard', purpose: 'The live Blazor (Interactive Server) UI as a Razor Class Library — jobs catalog, run history, per-job console with inline progress bars, and DAG run views. Mount with AddKlassdWorkflowsDashboard() / MapKlassdWorkflowsDashboard().' },
  { id: 'Klassd.Workflows.Auth', purpose: 'Optional dashboard authentication: email/password Users admin + cookie sign-in, with loopback bypass for local/port-forward. AddKlassdWorkflowsAuth().' },
  { id: 'Klassd.Workflows.Auth.OpenIdConnect', purpose: 'OpenID Connect single sign-on for the dashboard, built on the Auth seam (links/provisions a user by email). AddKlassdWorkflowsOpenIdConnect().' },
]
</script>

<template>
  <div class="docs">
    <aside class="docs-side">
      <nav class="docs-toc" aria-label="Workflows sections">
        <p class="docs-toc-title">Klassd.Workflows</p>
        <a v-for="s in sections" :key="s.id" :href="`#${s.id}`" class="docs-toc-link">{{ s.label }}</a>
        <a href="https://github.com/getklassd/Klassd.Workflows" target="_blank" rel="noopener" class="docs-toc-link docs-toc-api">GitHub repo →</a>
      </nav>
    </aside>

    <article class="docs-body">
      <header class="docs-head">
        <span class="badge">Workflows</span>
        <h1>Background jobs &amp; workflows, code-first</h1>
        <p class="docs-lede">
          Klassd.Workflows is a code-first, NuGet-distributed background-job and workflow engine for
          .NET. Jobs are plain C# classes; the scheduler runs each one as its <strong>own Kubernetes
          pod</strong> in production and as a local process in dev — the same worker either way.
          Compose jobs into DAG workflows and watch them run live.
        </p>
        <p class="docs-lede-meta">
          ← Back to the <a href="/workflows">Workflows overview</a>. A companion to
          <a href="/">Klassd</a>, the code-first headless CMS — same philosophy, separate package.
        </p>
      </header>

      <!-- Overview -->
      <section id="overview" class="docs-section">
        <h2>What you get</h2>
        <div class="docs-cards">
          <div v-for="f in features" :key="f.title" class="docs-card">
            <h3>{{ f.title }}</h3>
            <p>{{ f.body }}</p>
          </div>
        </div>
      </section>

      <!-- Quickstart -->
      <section id="quickstart" class="docs-section">
        <h2>Quickstart</h2>
        <p>Install the core plus the adapters you need. While Klassd.Workflows is in beta the packages are prerelease:</p>
        <pre class="docs-code"><code>{{ installCode }}</code></pre>

        <h3>1. Define a job</h3>
        <p>Any class implementing <code>IJob</code> is a unit of work. Use the <code>IJobContext</code> to log, report progress, and read arguments:</p>
        <pre class="docs-code"><code>{{ jobCode }}</code></pre>

        <h3>2. Wire it up in <code>Program.cs</code></h3>
        <p><code>AddKlassdWorkflowsCore()</code> returns a builder you use to pick a durable store; pick an executor separately:</p>
        <pre class="docs-code"><code>{{ wireCode }}</code></pre>

        <h3>3. Mount the dashboard <span class="docs-opt">(optional)</span></h3>
        <p>
          The dashboard ships as a Razor Class Library — add the package and two calls to get the
          live UI (jobs catalog, run history, per-job console with progress bars, DAG views) in your
          own ASP.NET Core host:
        </p>
        <pre class="docs-code"><code>{{ dashboardCode }}</code></pre>
        <p class="docs-note">
          If your host has no <code>.razor</code> of its own, set
          <code>&lt;RequiresAspNetWebAssets&gt;true&lt;/RequiresAspNetWebAssets&gt;</code> in its csproj
          (otherwise <code>_framework/blazor.web.js</code> 404s). The
          <code>samples/Klassd.Workflows.DashboardHost</code> project is a complete, runnable example.
        </p>

        <h3>4. Run</h3>
        <p>Enqueue jobs from code, or open the dashboard to start/stop them and watch live console output.</p>
      </section>

      <!-- Scheduling -->
      <section id="scheduling" class="docs-section">
        <h2>Scheduling</h2>
        <p>Fire a job now, or register a recurring job with a cron expression (parsed by Cronos):</p>
        <pre class="docs-code"><code>{{ scheduleCode }}</code></pre>
        <p>
          Recurring workflows are registered the same way with
          <code>AddOrUpdateRecurringWorkflow(id, name, cron)</code>. Pod resources (CPU/memory
          requests &amp; limits) are set per job with a <code>[JobResources]</code> attribute and can
          be retuned from config without a recompile.
        </p>
      </section>

      <!-- Workflows -->
      <section id="workflows" class="docs-section">
        <h2>Workflows (DAGs)</h2>
        <p>
          Jobs compose into a directed acyclic graph that fans out, waits on dependencies and passes
          data between nodes. The orchestrator runs in the scheduler; each node runs as a normal
          worker pod, so every node has its own live console.
        </p>
        <pre class="docs-code"><code>{{ dagCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Dependencies</strong> — a node starts once all its dependencies are satisfied; a failed dependency skips dependents.</li>
          <li><strong>Fan-out</strong> — read an upstream output as a JSON array and start one execution per element.</li>
          <li><strong>Conditions</strong> — run a node only when a predicate over upstream outputs holds (otherwise it's benignly omitted).</li>
          <li><strong>Retries</strong> — re-run a failed execution up to <em>n</em> times, per fan-out item.</li>
          <li><strong>Artifacts</strong> — large payloads pass through an <code>IArtifactStore</code>; a node saves an artifact and publishes the small reference downstream.</li>
        </ul>
      </section>

      <!-- Containers -->
      <section id="containers" class="docs-section">
        <h2>Container jobs &amp; service nodes</h2>
        <p>
          A node doesn't have to be a C# <code>IJob</code> — it can be <strong>any container image</strong>.
          That lets you run existing tools (a legacy Go binary, a vendor CLI) as first-class jobs and DAG
          nodes without porting them. Mark one <code>.AsService()</code> to keep it running as a sidecar
          and forward its address to dependents — the pattern for a <code>cloud-sql-proxy</code>:
        </p>
        <pre class="docs-code"><code>{{ containerNodeCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Address forwarding</strong> — the engine reads the pod IP and publishes <code>ip</code> / <code>address</code> outputs; dependents bind them with <code>BindInput</code>.</li>
          <li><strong>Readiness</strong> — a service node satisfies dependents once its pod is ready (optionally gated on a <code>ReadyOnTcp</code> port), not when it exits.</li>
          <li><strong>Teardown</strong> — services are stopped automatically when the rest of the run finishes; a Kubernetes <code>activeDeadlineSeconds</code> backstop reaps an orphan if the scheduler dies.</li>
        </ul>
        <p>You can also run a container as a <strong>standalone job</strong> (no workflow) — enqueue or schedule it like any other job:</p>
        <pre class="docs-code"><code>{{ containerJobCode }}</code></pre>
        <p class="docs-note">
          Under the Kubernetes executor a container node runs as its own pod; under the local executor
          it runs via <code>docker run</code>, so the same DAG works in dev without a cluster.
        </p>
      </section>

      <!-- Executors -->
      <section id="executors" class="docs-section">
        <h2>Executors: local &amp; Kubernetes</h2>
        <p>
          The <strong>same worker</strong> runs locally and in the cluster — only the executor that
          launches it differs. Communication is a line protocol on stdout, so Kubernetes pod logs are
          the transport for free.
        </p>
        <ul class="docs-list">
          <li><strong>Local</strong> — <code>AddLocalExecutor(...)</code> launches the worker as a child process per job. No cluster required; ideal for dev.</li>
          <li><strong>Kubernetes</strong> — <code>AddKubernetesExecutor(...)</code> creates a <code>batch/v1</code> Job (one pod, <code>restartPolicy: Never</code>) per execution, tails its logs, and cleans up via <code>ttlSecondsAfterFinished</code>. Stopping a job deletes the Job; SIGTERM cancels the worker's token.</li>
        </ul>
      </section>

      <!-- Storage -->
      <section id="storage" class="docs-section">
        <h2>Storage &amp; artifacts</h2>
        <p>Two pluggable seams, both with built-in adapters and open for your own:</p>
        <ul class="docs-list">
          <li><strong>Job store (<code>IJobStore</code>)</strong> — holds executions, recurring entries and workflow runs. In-memory by default; <code>UsePostgres(...)</code>, <code>UseMongo(...)</code> or <code>UseSqlite(...)</code> for durability. Each also provides the dashboard user store.</li>
          <li><strong>Artifact store (<code>IArtifactStore</code>)</strong> — holds large payloads between nodes. The worker selects a provider by name at runtime (<code>file</code>, <code>s3</code>, <code>gcs</code>), so the choice is per-deployment, not compiled in.</li>
        </ul>
        <p>
          Add your own by implementing the interface (plus an <code>IArtifactStoreProvider</code> for
          artifacts) — exactly how the Postgres/Mongo and S3/GCS packages do it.
        </p>
      </section>

      <!-- Auth -->
      <section id="auth" class="docs-section">
        <h2>Dashboard auth <span class="docs-opt">(optional)</span></h2>
        <p>
          The dashboard is unauthenticated by default. Add <code>Klassd.Workflows.Auth</code> for an
          email/password Users admin and cookie sign-in — the same model as the Klassd CMS — and
          <code>Klassd.Workflows.Auth.OpenIdConnect</code> for single sign-on (Entra ID, Okta, Auth0,
          Google, …). An SSO identity is linked to an existing user by email, or auto-provisioned.
        </p>
        <pre class="docs-code"><code>{{ authCode }}</code></pre>
        <ul class="docs-list">
          <li><strong>Loopback bypass</strong> — requests from <code>127.0.0.1</code>/<code>::1</code> skip auth, so local dev <em>and</em> <code>kubectl port-forward</code> need no login. Ingress traffic is always authenticated.</li>
          <li><strong>Seed admin</strong> — a first user is created from config on a fresh deployment, so you're never locked out.</li>
          <li><strong>Durable users</strong> — stored alongside jobs in your Postgres / MongoDB / SQLite store.</li>
        </ul>
      </section>

      <!-- Packages -->
      <section id="packages" class="docs-section">
        <h2>Packages</h2>
        <p>Install the core plus the adapters you need — each keeps its SDK isolated, so you only pull in what you wire up. While in beta, add <code>--prerelease</code>.</p>
        <div class="docs-table-wrap">
          <table class="docs-table">
            <thead><tr><th>Package</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr v-for="p in packages" :key="p.id">
                <td><a :href="`https://www.nuget.org/packages/${p.id}`" target="_blank" rel="noopener"><code class="docs-alias">{{ p.id }}</code></a></td>
                <td>{{ p.purpose }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="docs-cta-row">
          <a class="cta" href="https://github.com/getklassd/Klassd.Workflows" target="_blank" rel="noopener">View on GitHub</a>
          <a class="docs-ghost" href="https://www.nuget.org/profiles/getklassd" target="_blank" rel="noopener">All NuGet packages</a>
        </p>
      </section>
    </article>
  </div>
</template>
