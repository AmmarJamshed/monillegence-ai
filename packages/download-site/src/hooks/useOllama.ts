import { useCallback, useEffect, useState } from 'react';
import { OLLAMA_HOST } from '../config';

export type PullStatus = 'idle' | 'pulling' | 'done' | 'error';

export function useOllama() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [pullProgress, setPullProgress] = useState<Record<string, { status: PullStatus; percent?: number; message?: string }>>({});

  const checkOllama = useCallback(async () => {
    try {
      const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(3000) });
      setOnline(res.ok);
      return res.ok;
    } catch {
      setOnline(false);
      return false;
    }
  }, []);

  useEffect(() => {
    void checkOllama();
    const id = setInterval(() => void checkOllama(), 15000);
    return () => clearInterval(id);
  }, [checkOllama]);

  const pullModel = useCallback(async (ollamaTag: string) => {
    setPullProgress((p) => ({ ...p, [ollamaTag]: { status: 'pulling', percent: 0 } }));

    try {
      const res = await fetch(`${OLLAMA_HOST}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ollamaTag, stream: true }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Ollama pull failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line) as { status?: string; completed?: number; total?: number; error?: string };
            if (json.error) throw new Error(json.error);
            const percent =
              json.total && json.completed != null
                ? Math.round((json.completed / json.total) * 100)
                : undefined;
            setPullProgress((p) => ({
              ...p,
              [ollamaTag]: {
                status: json.status === 'success' ? 'done' : 'pulling',
                percent,
                message: json.status,
              },
            }));
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      setPullProgress((p) => ({ ...p, [ollamaTag]: { status: 'done', percent: 100 } }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pull failed';
      setPullProgress((p) => ({ ...p, [ollamaTag]: { status: 'error', message } }));
      return false;
    }
  }, []);

  const pullAllModels = useCallback(
    async (tags: string[]) => {
      for (const tag of tags) {
        const ok = await pullModel(tag);
        if (!ok) return false;
      }
      return true;
    },
    [pullModel],
  );

  return { online, pullProgress, checkOllama, pullModel, pullAllModels };
}
