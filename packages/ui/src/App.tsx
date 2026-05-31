import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_NAME } from '@monillegence/shared';
import { useAppStore } from './stores/appStore';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ChatPanel } from './components/ChatPanel';
import { ModelManager } from './components/ModelManager';
import './i18n';

type Tab = 'chat' | 'models';

export function App() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('chat');
  const loadConfig = useAppStore((s) => s.loadConfig);
  const fetchHealth = useAppStore((s) => s.fetchHealth);
  const fetchModels = useAppStore((s) => s.fetchModels);
  const connectWs = useAppStore((s) => s.connectWs);
  const pendingPermission = useAppStore((s) => s.pendingPermission);
  const resolvePermission = useAppStore((s) => s.resolvePermission);
  const config = useAppStore((s) => s.config);

  useEffect(() => {
    void loadConfig();
    void fetchHealth();
    void fetchModels();
    connectWs();
    const interval = setInterval(() => void fetchHealth(), 15000);
    return () => clearInterval(interval);
  }, [loadConfig, fetchHealth, fetchModels, connectWs]);

  useEffect(() => {
    if (config?.locale) {
      import('./i18n').then((m) => m.default.changeLanguage(config.locale));
    }
  }, [config?.locale]);

  return (
    <div className="flex h-screen flex-col bg-monil-bg text-white">
      <OnboardingFlow />

      {pendingPermission && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="max-w-md rounded-xl border border-amber-500/50 bg-monil-surface p-6">
            <h3 className="font-bold text-amber-400">Approval Required</h3>
            <p className="mt-2 text-sm">{pendingPermission.description}</p>
            <pre className="mt-3 max-h-32 overflow-auto rounded bg-monil-bg p-2 text-xs">
              {pendingPermission.preview}
            </pre>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => void resolvePermission(pendingPermission.id, true)}
                className="flex-1 rounded-lg bg-monil-primary py-2 text-sm font-semibold text-monil-bg"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => void resolvePermission(pendingPermission.id, false)}
                className="flex-1 rounded-lg border border-monil-border py-2 text-sm"
              >
                Deny
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between border-b border-monil-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🇵🇰</span>
          <span className="font-bold text-monil-primary">{APP_NAME}</span>
        </div>
        <nav className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab('chat')}
            className={`rounded-lg px-4 py-2 text-sm ${
              tab === 'chat' ? 'bg-monil-surface text-white' : 'text-monil-muted'
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setTab('models')}
            className={`rounded-lg px-4 py-2 text-sm ${
              tab === 'models' ? 'bg-monil-surface text-white' : 'text-monil-muted'
            }`}
          >
            {t('models')}
          </button>
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        {tab === 'chat' ? <ChatPanel /> : <ModelManager />}
      </main>
    </div>
  );
}
