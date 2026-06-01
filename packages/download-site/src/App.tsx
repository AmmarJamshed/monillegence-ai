import { useState } from 'react';
import { DOWNLOADS, GITHUB_URL } from './config';
import { MODEL_CATALOG } from './data/models';
import { useOllama } from './hooks/useOllama';
import { detectPlatform } from './utils/downloadScript';

export default function App() {
  const { online, pullProgress, pullModel } = useOllama();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const platform = detectPlatform();
  const isWin = platform === 'win';

  const installUrl = isWin ? DOWNLOADS.installWindows : DOWNLOADS.installMac;

  const handleInstall = () => {
    window.location.href = installUrl;
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-monil-border/60 bg-monil-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              🇵🇰
            </span>
            <span className="font-semibold text-white">Monillegence AI</span>
          </div>
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

      <section className="bg-hero px-4 pb-16 pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Build apps with AI on your PC
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-monil-muted">
            No coding setup. No cloud account. One installer does everything — then open from your
            Desktop.
          </p>

          <button
            type="button"
            onClick={handleInstall}
            className="mt-10 w-full max-w-md rounded-2xl bg-monil-primary px-10 py-5 text-xl font-bold text-monil-bg shadow-lg shadow-emerald-500/30 transition hover:bg-monil-glow sm:w-auto"
          >
            Install Monillegence AI
          </button>
          <p className="mt-3 text-sm text-monil-muted">
            Downloads a small installer · Run it once · Use the Desktop shortcut after that
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-monil-glow">
          How it works
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Step
            n={1}
            title="Click Install"
            text="Save the file, then double-click it. Allow it if Windows asks."
          />
          <Step
            n={2}
            title="Wait a few minutes"
            text="It downloads the app, sets it up, and adds AI. Grab a chai — first time only."
          />
          <Step
            n={3}
            title="Open from Desktop"
            text='Double-click "Monillegence AI" on your Desktop. Browser opens — start building.'
          />
        </div>

        <div className="mt-10 rounded-2xl border border-monil-primary/30 bg-monil-primary/5 p-6 text-center">
          <p className="text-white">
            Try saying:{' '}
            <span className="font-medium text-monil-glow">
              “Create a React todo app with Tailwind”
            </span>
          </p>
          <p className="mt-2 text-sm text-monil-muted">
            Monillegence writes real files on your computer and runs the app for you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8">
        <h2 className="text-lg font-semibold text-white">What you need (we help with this)</h2>
        <ul className="mt-4 space-y-3 text-monil-muted">
          <li className="flex gap-3">
            <span className="text-monil-glow">✓</span>
            <span>
              <strong className="text-white">Node.js</strong> — free. Installer opens the download
              page if missing.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-monil-glow">✓</span>
            <span>
              <strong className="text-white">Ollama</strong> — free local AI. Installer opens it if
              missing; starter model downloads automatically.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-monil-glow">✓</span>
            <span>
              <strong className="text-white">8 GB+ RAM</strong> — 16 GB recommended for bigger
              models.
            </span>
          </li>
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8">
        <details className="group rounded-2xl border border-monil-border bg-monil-card">
          <summary className="cursor-pointer list-none px-5 py-4 font-medium text-white marker:content-none">
            <span className="flex items-center justify-between">
              Optional: extra AI models
              <span className="text-monil-muted group-open:rotate-180 transition">▼</span>
            </span>
          </summary>
          <div className="border-t border-monil-border px-5 pb-5 pt-2">
            <p className="mb-4 text-sm text-monil-muted">
              The installer already includes the starter coding model. Add more only if you want
              them.
            </p>
            <div className="space-y-3">
              {MODEL_CATALOG.filter((m) => !m.isStarter).map((model) => {
                const progress = pullProgress[model.ollamaTag];
                return (
                  <div
                    key={model.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-monil-surface px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">{model.displayName}</p>
                      <p className="text-xs text-monil-muted">
                        {model.sizeLabel} · {model.ramLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void pullModel(model.ollamaTag)}
                      disabled={!online || progress?.status === 'pulling'}
                      className="rounded-lg bg-monil-primary/20 px-4 py-2 text-sm text-monil-glow disabled:opacity-40"
                    >
                      {!online
                        ? 'Open Monillegence first'
                        : progress?.status === 'pulling'
                          ? 'Downloading…'
                          : progress?.status === 'done'
                            ? 'Added ✓'
                            : 'Add model'}
                    </button>
                  </div>
                );
              })}
            </div>
            {online === false && (
              <p className="mt-3 text-xs text-monil-muted">
                Extra models need Ollama running (start Monillegence from Desktop first).
              </p>
            )}
          </div>
        </details>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-6">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-monil-muted underline-offset-2 hover:text-white hover:underline"
        >
          {showAdvanced ? 'Hide' : 'Show'} advanced / developer options
        </button>
        {showAdvanced && (
          <div className="mt-4 space-y-2 rounded-xl border border-monil-border bg-monil-card p-4 text-sm text-monil-muted">
            <p>
              <a href={DOWNLOADS.softwareZip} className="text-monil-glow hover:underline">
                Download source ZIP
              </a>{' '}
              · Install folder:{' '}
              <code className="text-slate-300">
                {isWin ? '%LOCALAPPDATA%\\Monillegence-AI' : '~/.local/share/Monillegence-AI'}
              </code>
            </p>
            <p>
              <a href={DOWNLOADS.ollama} className="text-monil-glow hover:underline">
                Ollama
              </a>{' '}
              ·{' '}
              <a href={DOWNLOADS.nodejs} className="text-monil-glow hover:underline">
                Node.js
              </a>{' '}
              ·{' '}
              <a href={GITHUB_URL} className="text-monil-glow hover:underline">
                GitHub repo
              </a>
            </p>
          </div>
        )}
      </section>

      <footer className="border-t border-monil-border py-8 text-center text-sm text-monil-muted">
        <p>MIT License · Built in Pakistan 🇵🇰</p>
      </footer>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-monil-primary/20 text-lg font-bold text-monil-glow">
        {n}
      </div>
      <h3 className="mt-3 font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-monil-muted">{text}</p>
    </div>
  );
}
