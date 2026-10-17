import type { Prisma } from "@prisma/client";
import type { Db } from "@/server/db";

export type AuditEntry = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  changes?: Prisma.InputJsonValue;
  ipAddress?: string | null;
};

/**
 * Append-only audit trail for sensitive operations. Always call with the
 * transaction client of the change being audited so both commit (or roll back)
 * together.
 */
export async function recordAudit(db: Db, entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      summary: entry.summary.slice(0, 500),
      changes: entry.changes,
      ipAddress: entry.ipAddress ?? null,
    },
  });
}

/** Builds a { field: { from, to } } diff for the keys that changed. */
export function diff<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after) as (keyof T)[]) {
    const from = before[key];
    const to = after[key];
    if (to === undefined) continue;
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes[key as string] = { from: normalize(from), to: normalize(to) };
    }
  }
  return changes;
}

function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value ?? null;
}
