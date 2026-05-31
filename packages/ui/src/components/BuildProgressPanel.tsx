import { useAppStore } from '../stores/appStore';

export function BuildProgressPanel() {
  const buildStatus = useAppStore((s) => s.buildStatus);
  const buildFiles = useAppStore((s) => s.buildFiles);
  const buildElapsedSec = useAppStore((s) => s.buildElapsedSec);
  const buildPhase = useAppStore((s) => s.buildPhase);
  const buildActive = useAppStore((s) => s.buildActive);
  const lastProjectPath = useAppStore((s) => s.lastProjectPath);
  const lastRunCommand = useAppStore((s) => s.lastRunCommand);
  const buildValid = useAppStore((s) => s.buildValid);

  if (!buildActive && buildFiles.length === 0 && !buildStatus) {
    return null;
  }

  const writtenCount = buildFiles.filter((f) => f.status === 'written').length;
  const generatingCount = buildFiles.filter((f) => f.status === 'generating').length;

  return (
    <div className="border-b border-monil-border bg-monil-surface/80 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            {buildActive && (
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-monil-primary" />
            )}
            <span>{buildStatus ?? 'Build in progress…'}</span>
          </div>
          {buildPhase && (
            <p className="mt-0.5 text-xs capitalize text-monil-muted">Phase: {buildPhase}</p>
          )}
        </div>
        {buildElapsedSec > 0 && (
          <div className="shrink-0 text-right text-xs text-monil-muted">
            <div>{buildElapsedSec}s elapsed</div>
            {generatingCount > 0 && (
              <div className="text-monil-primary">{generatingCount} generating</div>
            )}
            {writtenCount > 0 && (
              <div className="text-emerald-400">{writtenCount} written</div>
            )}
          </div>
        )}
      </div>

      {buildFiles.length > 0 && (
        <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto font-mono text-[11px]">
          {buildFiles.map((file) => (
            <li
              key={file.path}
              className={`flex items-center gap-2 rounded px-2 py-1 ${
                file.status === 'written'
                  ? 'bg-emerald-950/40 text-emerald-300'
                  : file.status === 'generating'
                    ? 'bg-monil-bg text-amber-200'
                    : 'bg-monil-bg text-monil-muted'
              }`}
            >
              <span>
                {file.status === 'written'
                  ? '✓'
                  : file.status === 'generating'
                    ? '◐'
                    : '○'}
              </span>
              <span className="truncate">{file.path}</span>
            </li>
          ))}
        </ul>
      )}

      {lastProjectPath && !buildActive && (
        <div className="mt-2 rounded border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 font-mono text-[11px] text-emerald-200">
          <div>{lastProjectPath}</div>
          {lastRunCommand && buildValid && (
            <div className="mt-1 text-monil-muted">Run: cd &quot;{lastProjectPath}&quot; → {lastRunCommand}</div>
          )}
        </div>
      )}
    </div>
  );
}
