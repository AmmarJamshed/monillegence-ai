import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { BuildArtifactPanel } from './BuildArtifactPanel';

export function ChatPanel() {
  const { t } = useTranslation();
  const chat = useAppStore((s) => s.chat);
  const sendChat = useAppStore((s) => s.sendChat);
  const lastRouting = useAppStore((s) => s.lastRouting);
  const buildActive = useAppStore((s) => s.buildActive);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    sendChat(input.trim());
    setInput('');
  };

  return (
    <div className="flex h-full">
      {/* Chat — Claude-style left panel */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-monil-border lg:max-w-[42%]">
        {lastRouting && (
          <div className="border-b border-monil-border px-4 py-2 text-xs text-monil-muted">
            Model: <span className="text-monil-primary">{lastRouting.modelId}</span>
            {' · '}
            {lastRouting.reason}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chat.length === 0 && (
            <div className="text-center text-monil-muted">
              <p className="mb-4">{t('suggestedPrompts')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[t('prompt1'), t('prompt2'), t('prompt3')].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => sendChat(p)}
                    className="rounded-full border border-monil-border px-4 py-2 text-sm hover:border-monil-primary hover:text-monil-primary"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chat.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'ml-4 bg-monil-primary/20 text-white'
                  : 'mr-4 bg-monil-surface border border-monil-border'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {msg.content ||
                  (msg.streaming && buildActive
                    ? 'Building on the right → watch files appear live.'
                    : msg.streaming
                      ? 'Thinking…'
                      : '')}
              </pre>
              {msg.streaming && (
                <span className="inline-block h-4 w-1 animate-pulse bg-monil-primary" />
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-monil-border p-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={t('chatPlaceholder')}
              className="flex-1 rounded-lg border border-monil-border bg-monil-bg px-4 py-3 text-sm outline-none focus:border-monil-primary"
            />
            <button
              type="button"
              onClick={handleSend}
              className="rounded-lg bg-monil-primary px-6 py-3 font-semibold text-monil-bg hover:bg-emerald-400"
            >
              {t('send')}
            </button>
          </div>
        </div>
      </div>

      {/* Artifact panel — Claude-style right panel */}
      <div className="hidden min-w-0 flex-1 lg:flex">
        <BuildArtifactPanel />
      </div>
    </div>
  );
}
