import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  DEFAULT_USER_CONFIG,
  MODEL_CATALOG,
  type ChatMessage,
  type UserConfig,
} from '@monillegence/shared';
import { v4 as uuid } from 'uuid';

export class ConfigStore {
  private path: string;
  private cache: UserConfig = { ...DEFAULT_USER_CONFIG };

  constructor(dataDir: string) {
    this.path = join(dataDir, 'config.json');
  }

  async load(): Promise<UserConfig> {
    try {
      const raw = await readFile(this.path, 'utf-8');
      this.cache = { ...DEFAULT_USER_CONFIG, ...JSON.parse(raw) };
    } catch {
      await this.save();
    }
    return this.cache;
  }

  async save(partial?: Partial<UserConfig>): Promise<UserConfig> {
    if (partial) this.cache = { ...this.cache, ...partial };
    await mkdir(join(this.path, '..'), { recursive: true });
    await writeFile(this.path, JSON.stringify(this.cache, null, 2), 'utf-8');
    return this.cache;
  }

  get(): UserConfig {
    return this.cache;
  }
}

export function createChatMessage(
  role: ChatMessage['role'],
  content: string,
  extras?: Partial<ChatMessage>
): ChatMessage {
  return {
    id: uuid(),
    role,
    content,
    timestamp: new Date().toISOString(),
    ...extras,
  };
}

export { MODEL_CATALOG };
