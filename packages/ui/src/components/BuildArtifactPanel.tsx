import { useAppStore } from '../stores/appStore';

const STEP_ORDER = ['plan', 'scaffold', 'parallel', 'write', 'install', 'validate', 'done'];

export function BuildArtifactPanel() {
  const buildActive = useAppStore((s) => s.buildActive);
  const buildTimeline = useAppStore((s) => s.buildTimeline);
  const buildCompute = useAppStore((s) => s.buildCompute);
  const buildFiles = useAppStore((s) => s.buildFiles);
  const selectedFile = useAppStore((s) => s.selectedBuildFile);
  const setSelectedFile = useAppStore((s) => s.setSelectedBuildFile);
  const filePreviews = useAppStore((s) => s.filePreviews);
  const lastProjectPath = useAppStore((s) => s.lastProjectPath);
  const buildElapsedSec = useAppStore((s) => s.buildElapsedSec);

  const show =
    buildActive ||
    buildTimeline.length > 0 ||
    buildFiles.length > 0 ||
    lastProjectPath;

  if (!show) {
    return (
      <div className="flex h-full flex-col items-center justify-center border-l border-monil-border bg-monil-surface/30 p-8 text-center text-monil-muted">
        <div className="mb-3 text-4xl">⚡</div>
        <p className="text-sm font-medium text-white">Build workspace</p>
        <p className="mt-2 max-w-xs text-xs">
          Ask to create an app — files appear here in real time, Claude-style.
        </p>
      </div>
    );
  }

  const sortedTimeline = [...buildTimeline].sort(
    (a, b) => STEP_ORDER.indexOf(a.id) - STEP_ORDER.indexOf(b.id)
  );

  const selectedPreview = selectedFile ? filePreviews[selectedFile] : null;

  return (
    <div className="flex h-full flex-col border-l border-monil-border bg-[#0a0e14]">
      {/* Header — compute bar */}
      <div className="border-b border-monil-border px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-monil-muted">
            Artifact
          </span>
          {buildElapsedSec > 0 && (
            <span className="font-mono text-xs text-monil-muted">{buildElapsedSec}s</span>
          )}
        </div>
        {buildCompute && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-violet-950/60 px-2 py-0.5 text-[10px] text-violet-300">
              {buildCompute.cores} CPU cores
            </span>
            <span className="rounded-full bg-blue-950/60 px-2 py-0.5 text-[10px] text-blue-300">
              {buildCompute.workers} parallel workers
            </span>
            {buildCompute.activeTasks > 0 && (
              <span className="rounded-full bg-amber-950/60 px-2 py-0.5 text-[10px] text-amber-300">
                {buildCompute.activeTasks} active
              </span>
            )}
          </div>
        )}
        {buildCompute?.strategy && (
          <p className="mt-1.5 text-[11px] text-monil-muted">{buildCompute.strategy}</p>
        )}
      </div>

      {/* Timeline — Claude-style steps */}
      <div className="border-b border-monil-border px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-monil-muted">
          Activity
        </p>
        <ul className="space-y-1.5">
          {sortedTimeline.map((step) => (
            <li key={step.id} className="flex items-center gap-2 text-xs">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  step.status === 'done'
                    ? 'bg-emerald-900/50 text-emerald-400'
                    : step.status === 'active'
                      ? 'animate-pulse bg-violet-900/50 text-violet-300'
                      : 'bg-monil-border text-monil-muted'
                }`}
              >
                {step.status === 'done' ? '✓' : step.status === 'active' ? '●' : '○'}
              </span>
              <span
                className={
                  step.status === 'active' ? 'text-white' : 'text-monil-muted'
                }
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* File tree + preview split */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="w-full shrink-0 border-b border-monil-border md:w-48 md:border-b-0 md:border-r">
          <p className="border-b border-monil-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-monil-muted">
            Files
          </p>
          <ul className="max-h-48 overflow-y-auto p-2 md:max-h-none md:flex-1">
            {buildFiles.map((file) => (
              <li key={file.path}>
                <button
                  type="button"
                  onClick={() => setSelectedFile(file.path)}
                  className={`flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left font-mono text-[11px] ${
                    selectedFile === file.path
                      ? 'bg-monil-primary/20 text-monil-primary'
                      : 'text-monil-muted hover:bg-monil-surface hover:text-white'
                  }`}
                >
                  <span>
                    {file.status === 'written' || file.status === 'done'
                      ? '✓'
                      : file.status === 'scaffolded'
                        ? '⚡'
                        : file.status === 'generating'
                          ? '◐'
                          : '○'}
                  </span>
                  <span className="truncate">{file.path.split('/').pop()}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <p className="border-b border-monil-border px-3 py-2 font-mono text-[10px] text-monil-muted">
            {selectedFile ?? 'Select a file'}
          </p>
          <pre className="h-full overflow-auto p-3 font-mono text-[11px] leading-relaxed text-slate-300">
            {selectedPreview ??
              (selectedFile
                ? 'Generating…'
                : 'Click a file to preview its contents.')}
          </pre>
        </div>
      </div>

      {lastProjectPath && !buildActive && (
        <div className="border-t border-emerald-500/30 bg-emerald-950/20 px-4 py-2 font-mono text-[10px] text-emerald-300">
          {lastProjectPath}
        </div>
      )}
    </div>
  );
}
