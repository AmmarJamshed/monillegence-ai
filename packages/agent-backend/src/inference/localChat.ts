import type { AgentTaskType } from '@monillegence/shared';

export interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChatOptions {
  baseUrl: string;
  model: string;
  messages: ChatMessageParam[];
  temperature?: number;
  signal?: AbortSignal;
}

/**
 * Stream chat completions via OpenAI-compatible localhost APIs (Ollama, LM Studio).
 * Uses fetch + SSE parsing — the OpenAI Node SDK streaming hangs with some local runtimes.
 */
export async function* streamChatCompletions(
  options: StreamChatOptions
): AsyncGenerator<string> {
  const url = `${options.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: true,
      temperature: options.temperature ?? 0.7,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Inference failed (${response.status}): ${text || response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body from local runtime');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      try {
        const json = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        /* skip malformed SSE chunks */
      }
    }
  }
}

export async function chatCompletion(
  options: StreamChatOptions
): Promise<string> {
  const url = `${options.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: false,
      temperature: options.temperature ?? 0.7,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Inference failed (${response.status}): ${text || response.statusText}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? '';
}

export function taskTemperature(taskType: AgentTaskType): number {
  return taskType === 'autocomplete' ? 0.2 : 0.7;
}
