import { useState } from 'react';
import { DOWNLOADS, GITHUB_URL } from './config';
import { MODEL_CATALOG } from './data/models';
import { useOllama } from './hooks/useOllama';
import {
  detectPlatform,
  downloadTextFile,
  scriptFullSetupWin,
  scriptPullAll,
  scriptPullModel,
} from './utils/downloadScript';

function tierBadge(tier: string) {
  const colors: Record<string, string> = {
    small: 'bg-emerald-500/20 text-emerald-300',
    medium: 'bg-amber-500/20 text-amber-300',
    large: 'bg-rose-500/20 text-rose-300',
  };
  return colors[tier] ?? 'bg-slate-500/20 text-slate-300';
}

export default function App() {
  const { online, pullProgress, checkOllama, pullModel, pullAllModels } = useOllama();
  const [bundleBusy, setBundleBusy] = useState(false);
  const platform = detectPlatform();

  const triggerSoftwareDownload = () => {
    window.location.href = DOWNLOADS.softwareZip;
  };

  const triggerSetupScript = () => {
    if (platform === 'win') {
      downloadTextFile('install-monillegence-full.bat', scriptFullSetupWin());
    } else {
      downloadTextFile(
        'install-monillegence.sh',
        `#!/bin/sh\ngit clone https://github.com/AmmarJamshed/monillegence-ai.git "$HOME/Monillegence-AI"\ncd "$HOME/Monillegence-AI" && pnpm install && cp -n .env.example .env\n`,
      );
    }
  };

  const downloadModelScript = (tag: string) => {
    const ext = platform === 'win' ? 'bat' : 'sh';
    downloadTextFile(`pull-${tag.replace(/[:]/g, '-')}.${ext}`, scriptPullModel(tag, platform));
  };

  const downloadAllModelsScript = () => {
    const tags = MODEL_CATALOG.map((m) => m.ollamaTag);
    const ext = platform === 'win' ? 'bat' : 'sh';
    downloadTextFile(`pull-all-models.${ext}`, scriptPullAll(tags, platform));
  };

  const handleDownloadEverything = async () => {
    setBundleBusy(true);
    triggerSoftwareDownload();
    window.open(DOWNLOADS.ollama, '_blank', 'noopener');
    downloadAllModelsScript();

    const ok = await checkOllama();
    if (ok) {
      await pullAllModels(MODEL_CATALOG.map((m) => m.ollamaTag));
    }
    setBundleBusy(false);
  };

  const handleModelDownload = async (tag: string) => {
    const ok = await checkOllama();
    if (ok) {
      await pullModel(tag);
    } else {
      downloadModelScript(tag);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-monil-border/60 bg-monil-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              🇵🇰
            </span>
            <div>
              <p className="font-semibold text-white">Monillegence AI</p>
              <p className="text-xs text-monil-muted">Download center</p>
            </div>
          </div>
          <nav className="hidden gap-6 text-sm text-monil-muted sm:flex">
            <a href="#download" className="hover:text-monil-primary">
              Software
            </a>
            <a href="#models" className="hover:text-monil-primary">
              Models
            </a>
            <a href="#start" className="hover:text-monil-primary">
              Quick start
            </a>
          </nav>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-monil-muted hover:text-white"
          >
            GitHub
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden bg-hero px-4 pb-20 pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 inline-block rounded-full border border-monil-primary/30 bg-monil-primary/10 px-4 py-1 text-sm text-monil-glow">
            Built in Pakistan · Local-first · Open source
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Download Monillegence AI
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-monil-muted">
            One place to get the app, Ollama, and every AI model. Build React apps, utilities, and
            software on your machine — no cloud API keys.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={triggerSoftwareDownload}
              className="w-full rounded-xl bg-monil-primary px-8 py-4 text-lg font-semibold text-monil-bg shadow-lg shadow-emerald-500/25 transition hover:bg-monil-glow sm:w-auto"
            >
              Download software (ZIP)
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadEverything()}
              disabled={bundleBusy}
              className="w-full rounded-xl border border-monil-primary/50 bg-monil-card px-8 py-4 text-lg font-semibold text-monil-glow transition hover:bg-monil-surface disabled:opacity-60 sm:w-auto"
            >
              {bundleBusy ? 'Starting downloads…' : 'Download everything'}
            </button>
          </div>
          <p className="mt-4 text-sm text-monil-muted">
            “Download everything” gets the app ZIP, opens Ollama installer, downloads model scripts,
            and pulls models automatically if Ollama is already running.
          </p>
        </div>
      </section>

      <section id="download" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-white">Software</h2>
        <p className="mt-2 text-monil-muted">Get Monillegence AI on your PC in one click.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <DownloadCard
            title="Monillegence AI"
            subtitle="v0.1.0 release ZIP"
            description="Full source — extract, run setup, start building apps."
            actionLabel="Download ZIP"
            onAction={triggerSoftwareDownload}
            primary
          />
          <DownloadCard
            title="Windows auto-setup"
            subtitle=".bat installer"
            description="Clones the repo (if needed) and runs setup-windows.bat."
            actionLabel="Download setup script"
            onAction={triggerSetupScript}
          />
          <DownloadCard
            title="Prerequisites"
            subtitle="Node.js + Ollama"
            description="Required before first run. Ollama runs AI models locally."
            actionLabel="Get Ollama"
            onAction={() => window.open(DOWNLOADS.ollama, '_blank', 'noopener')}
            secondaryAction={{ label: 'Get Node.js', href: DOWNLOADS.nodejs }}
          />
        </div>
      </section>

      <section id="models" className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">AI models</h2>
            <p className="mt-2 text-monil-muted">
              {online === true && (
                <span className="text-monil-glow">● Ollama detected — one-click pull enabled</span>
              )}
              {online === false && (
                <span>Install Ollama first, or download a script to pull offline.</span>
              )}
              {online === null && <span>Checking Ollama…</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={downloadAllModelsScript}
            className="rounded-lg border border-monil-border px-4 py-2 text-sm text-monil-muted hover:border-monil-primary hover:text-white"
          >
            Download all-models script
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODEL_CATALOG.map((model) => {
            const progress = pullProgress[model.ollamaTag];
            return (
              <article
                key={model.id}
                className="rounded-2xl border border-monil-border bg-monil-card p-5 transition hover:border-monil-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white">{model.displayName}</h3>
                  {model.isStarter && (
                    <span className="shrink-0 rounded bg-monil-primary/20 px-2 py-0.5 text-xs text-monil-glow">
                      Starter
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-monil-muted">{model.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${tierBadge(model.tier)}`}>
                    {model.tier}
                  </span>
                  <span className="text-xs text-monil-muted">{model.sizeLabel}</span>
                  <span className="text-xs text-monil-muted">{model.ramLabel}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {model.tags.map((t) => (
                    <span key={t} className="rounded bg-monil-surface px-2 py-0.5 text-xs text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>

                {progress?.status === 'pulling' && (
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-monil-surface">
                      <div
                        className="h-full bg-monil-primary transition-all"
                        style={{ width: `${progress.percent ?? 30}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-monil-muted">{progress.message ?? 'Downloading…'}</p>
                  </div>
                )}
                {progress?.status === 'done' && (
                  <p className="mt-3 text-sm text-monil-glow">✓ Installed in Ollama</p>
                )}
                {progress?.status === 'error' && (
                  <p className="mt-3 text-sm text-rose-400">{progress.message}</p>
                )}

                <button
                  type="button"
                  onClick={() => void handleModelDownload(model.ollamaTag)}
                  className="mt-4 w-full rounded-lg bg-monil-surface py-2.5 text-sm font-medium text-white ring-1 ring-monil-border transition hover:ring-monil-primary"
                >
                  {online ? 'Download model' : 'Download pull script'}
                </button>
                <p className="mt-2 text-center font-mono text-xs text-monil-muted">{model.ollamaTag}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="start" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-white">After download</h2>
        <ol className="mt-6 space-y-4 text-monil-muted">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-monil-primary/20 text-sm font-bold text-monil-glow">
              1
            </span>
            <span>
              Extract the ZIP (or run the setup script). Open terminal in the folder and run{' '}
              <code className="rounded bg-monil-surface px-2 py-0.5 text-monil-glow">pnpm install</code>
            </span>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-monil-primary/20 text-sm font-bold text-monil-glow">
              2
            </span>
            <span>
              Pull the starter model above, or run{' '}
              <code className="rounded bg-monil-surface px-2 py-0.5 text-monil-glow">
                ollama pull qwen2.5-coder:7b
              </code>
            </span>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-monil-primary/20 text-sm font-bold text-monil-glow">
              3
            </span>
            <span>
              Start backend: <code className="rounded bg-monil-surface px-2 py-0.5">pnpm dev:backend</code>{' '}
              · UI: <code className="rounded bg-monil-surface px-2 py-0.5">pnpm dev:ui</code> · Open{' '}
              <a href="http://localhost:5173" className="text-monil-glow hover:underline">
                localhost:5173
              </a>
            </span>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-monil-primary/20 text-sm font-bold text-monil-glow">
              4
            </span>
            <span>
              Chat: <em className="text-white">“Create a React todo app with Tailwind”</em> — Monillegence
              builds it on your machine.
            </span>
          </li>
        </ol>
      </section>

      <footer className="border-t border-monil-border py-10 text-center text-sm text-monil-muted">
        <p>MIT License · AI-generated code may contain bugs — review before production use.</p>
        <p className="mt-2">
          <a href={GITHUB_URL} className="text-monil-glow hover:underline">
            github.com/AmmarJamshed/monillegence-ai
          </a>
        </p>
      </footer>
    </div>
  );
}

function DownloadCard({
  title,
  subtitle,
  description,
  actionLabel,
  onAction,
  primary,
  secondaryAction,
}: {
  title: string;
  subtitle: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  primary?: boolean;
  secondaryAction?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-monil-border bg-monil-card p-6">
      <p className="text-xs uppercase tracking-wide text-monil-muted">{subtitle}</p>
      <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-monil-muted">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className={
          primary
            ? 'mt-5 rounded-lg bg-monil-primary py-2.5 font-medium text-monil-bg hover:bg-monil-glow'
            : 'mt-5 rounded-lg bg-monil-surface py-2.5 font-medium text-white ring-1 ring-monil-border hover:ring-monil-primary'
        }
      >
        {actionLabel}
      </button>
      {secondaryAction && (
        <a
          href={secondaryAction.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-center text-sm text-monil-muted hover:text-monil-glow"
        >
          {secondaryAction.label}
        </a>
      )}
    </div>
  );
}
