import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { v4 as uuid } from 'uuid';
import type {
  AuditLogEntry,
  PermissionAction,
  PermissionRequest,
  RiskLevel,
} from '@monillegence/shared';

const RISK_BY_ACTION: Record<PermissionAction, RiskLevel> = {
  terminal_execute: 'high',
  file_delete: 'critical',
  file_write: 'medium',
  deploy: 'critical',
  env_modify: 'high',
  credential_access: 'critical',
  domain_connect: 'critical',
};

export class AuditLogger {
  private logPath: string;

  constructor(dataDir: string) {
    this.logPath = join(dataDir, 'audit.jsonl');
  }

  async init(): Promise<void> {
    const { dirname } = await import('node:path');
    await mkdir(dirname(this.logPath), { recursive: true });
  }

  async write(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
  ): Promise<AuditLogEntry> {
    const full: AuditLogEntry = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    await appendFile(this.logPath, JSON.stringify(full) + '\n', 'utf-8');
    return full;
  }

  async read(limit = 100): Promise<AuditLogEntry[]> {
    try {
      const raw = await readFile(this.logPath, 'utf-8');
      return raw
        .trim()
        .split('\n')
        .filter(Boolean)
        .slice(-limit)
        .map((line) => JSON.parse(line) as AuditLogEntry);
    } catch {
      return [];
    }
  }
}

type ResolveCallback = (approved: boolean) => void;

export class PermissionGate {
  private pending = new Map<string, PermissionRequest>();
  private resolvers = new Map<string, ResolveCallback>();
  private audit: AuditLogger;

  constructor(audit: AuditLogger) {
    this.audit = audit;
  }

  async request(
    action: PermissionAction,
    description: string,
    preview: string,
    metadata: Record<string, unknown> = {}
  ): Promise<PermissionRequest> {
    const request: PermissionRequest = {
      id: uuid(),
      action,
      description,
      preview,
      riskLevel: RISK_BY_ACTION[action],
      metadata,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    this.pending.set(request.id, request);
    await this.audit.write({
      action: 'permission_requested',
      actor: 'agent',
      permissionRequestId: request.id,
      outcome: 'success',
      details: { action, description },
    });
    return request;
  }

  getRequest(id: string): PermissionRequest | undefined {
    return this.pending.get(id);
  }

  async resolve(id: string, approved: boolean): Promise<PermissionRequest | null> {
    const req = this.pending.get(id);
    if (!req || req.status !== 'pending') return null;

    req.status = approved ? 'approved' : 'denied';
    req.resolvedAt = new Date().toISOString();

    const resolver = this.resolvers.get(id);
    if (resolver) {
      resolver(approved);
      this.resolvers.delete(id);
    }

    await this.audit.write({
      action: approved ? 'permission_approved' : 'permission_denied',
      actor: 'user',
      permissionRequestId: id,
      outcome: approved ? 'success' : 'denied',
      details: { action: req.action },
    });

    return req;
  }

  waitForApproval(id: string, timeoutMs = 120000): Promise<boolean> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        const req = this.pending.get(id);
        if (req && req.status === 'pending') {
          req.status = 'expired';
        }
        this.resolvers.delete(id);
        resolve(false);
      }, timeoutMs);

      this.resolvers.set(id, (approved) => {
        clearTimeout(timer);
        resolve(approved);
      });
    });
  }

  requiresApproval(_action: PermissionAction): boolean {
    return process.env.MONILLEGENCE_REQUIRE_APPROVAL !== 'false';
  }
}
