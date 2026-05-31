import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';

export function ModelManager() {
  const { t } = useTranslation();
  const catalog = useAppStore((s) => s.catalog);
  const installed = useAppStore((s) => s.installedModels);
  const health = useAppStore((s) => s.health);
  const runtime = useAppStore((s) => s.runtime);

  const formatBytes = (b: number) => `${(b / 1e9).toFixed(1)} GB`;

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="mb-4 text-lg font-bold">{t('models')}</h2>

      <div className="mb-6 rounded-lg border border-monil-border bg-monil-surface p-4">
        <h3 className="text-sm font-semibold text-monil-muted">{t('runtimeStatus')}</h3>
        <p className="mt-1 text-sm">
          <span
            className={`inline-block h-2 w-2 rounded-full mr-2 ${
              health?.runtime === 'running' ? 'bg-emerald-400' : 'bg-red-400'
            }`}
          />
          {runtime?.type ?? 'none'} — {health?.runtime === 'running' ? t('running') : t('stopped')}
        </p>
        <p className="mt-1 text-xs text-monil-muted">
          {health?.modelsReady ?? 0} models ready
        </p>
      </div>

      <div className="space-y-3">
        {catalog.map((model) => {
          const isInstalled = installed.some((i) =>
            i.includes(model.ollamaTag?.split(':')[0] ?? model.name)
          );
          return (
            <div
              key={model.id}
              className="rounded-lg border border-monil-border bg-monil-surface p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{model.displayName}</h4>
                  <p className="text-xs text-monil-muted">
                    {model.tier} · {formatBytes(model.sizeBytes)} · RAM{' '}
                    {(model.ramRequiredMb / 1024).toFixed(0)} GB
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isInstalled
                      ? 'bg-emerald-900/50 text-emerald-300'
                      : 'bg-monil-border text-monil-muted'
                  }`}
                >
                  {isInstalled ? 'Installed' : 'Available'}
                </span>
              </div>
              {model.isStarter && (
                <span className="mt-2 inline-block text-xs text-monil-primary">
                  Recommended starter
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
