<script setup lang="ts">
// Marketing landing for the Klassd.Workflows package — mirrors the CMS home page (Hero + feature
// grid + code showcase + teaser), but the copy is static (not CMS-driven) and it prerenders into
// /workflows/index.html. The full docs live at /workflows/docs (WorkflowsDocs.vue).
import Hero from './Hero.vue'
import FeatureCard from './FeatureCard.vue'
import CodeShowcase from './CodeShowcase.vue'

interface Feature { title: string; body: string }
const features: Feature[] = [
  { title: 'Code-first jobs', body: 'A job is a C# class implementing IJob — no YAML, no attributes-as-config. The engine discovers it by type name.' },
  { title: 'Runs in its own pod', body: 'Each execution is a batch/v1 Kubernetes Job (one pod), with per-job CPU/memory requests and limits.' },
  { title: 'Same worker, local too', body: 'In dev the same worker runs as a child process — no cluster needed. Switch to Kubernetes with one config setting.' },
  { title: 'DAG workflows', body: 'Compose jobs into a graph: dependencies, fan-out (one pod per item), conditional nodes, retries, and artifact passing.' },
  { title: 'Run any container', body: 'Run an arbitrary container image as a job or DAG node — not just IJob classes. Bring legacy tools (a Go binary, anything) without porting them.' },
  { title: 'Service (daemon) nodes', body: 'Long-running sidecars like cloud-sql-proxy: a node comes up, forwards its address to dependents, stays up while they run, and is torn down when the workflow ends.' },
  { title: 'Live dashboard', body: 'A Blazor dashboard shows the job list, per-job console + progress, recurring jobs, and an SVG view of each DAG run.' },
  { title: 'Dashboard SSO & users', body: 'Email/password users plus OpenID Connect single sign-on. Loopback (local dev / kubectl port-forward) is bypassed, so no login there.' },
  { title: 'Durable & pluggable', body: 'Swap the job store (in-memory / Postgres / MongoDB / SQLite) and the artifact store (filesystem / S3 / GCS) — or ship your own.' },
]

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

const installCode = `# Klassd.Workflows is in beta — install the prerelease packages
dotnet add package Klassd.Workflows.Core --prerelease
dotnet add package Klassd.Workflows.Kubernetes --prerelease`
</script>

<template>
  <Hero
    badge="Workflows for .NET"
    title="Background jobs &amp; workflows, code-first"
    subtitle="Klassd.Workflows runs your C# jobs as their own Kubernetes pods — or local processes in dev. Schedule them with cron, compose them into DAG workflows, and watch every run live."
    cta-text="Get started on GitHub"
    cta-url="https://github.com/getklassd/Klassd.Workflows"
  />

  <section class="features">
    <FeatureCard v-for="(f, i) in features" :key="i" :title="f.title" :body="f.body" />
  </section>

  <CodeShowcase
    heading="A job is just a C# class"
    subtitle="Implement IJob, log and report progress through the context, and let the scheduler run it anywhere. The same worker runs locally and in the cluster."
    code-caption="MyJob.cs"
    :code="jobCode"
    :install="installCode"
  />

  <section class="compare-teaser">
    <p>Want the full picture — DAGs, executors, durable stores, artifact backends and the package list?</p>
    <a class="cta" href="/workflows/docs">Read the docs →</a>
  </section>
</template>
