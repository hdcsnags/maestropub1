import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

type AuditActor = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
};

type AuditMetadata = Record<string, unknown> | null;

type AuditEntry = {
  id?: string;
  action?: string;
  targetType?: string | null;
  targetId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  metadata?: AuditMetadata;
  createdAt?: string | Date;
  actor?: AuditActor | null;
  target?: Record<string, unknown> | null;
};

type AuditListResult = {
  items?: AuditEntry[];
  total?: number;
  page?: number;
  pageSize?: number;
} | AuditEntry[];

type AuditQuery = {
  page?: number | string;
  pageSize?: number | string;
  action?: string;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  from?: string;
  to?: string;
  search?: string;
};

type AuditService = {
  listAuditLogs?: (query: {
    page: number;
    pageSize: number;
    action?: string;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    from?: string;
    to?: string;
    search?: string;
  }) => Promise<AuditListResult>;
  getAuditLogs?: (query: {
    page: number;
    pageSize: number;
    action?: string;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    from?: string;
    to?: string;
    search?: string;
  }) => Promise<AuditListResult>;
};

type ServicesContainer = {
  audit?: AuditService;
};

type RouteDependencies = {
  services?: ServicesContainer;
};

type FastifyWithDeps = typeof import('fastify') extends { FastifyInstance: infer T } ? T : never;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function clampPageSize(value: unknown): number {
  const size = toPositiveInt(value, DEFAULT_PAGE_SIZE);
  return Math.min(size, MAX_PAGE_SIZE);
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeAuditEntry(entry: AuditEntry) {
  const actor = entry.actor ?? {
    id: entry.actorId ?? null,
    email: entry.actorEmail ?? null,
    name: entry.actorName ?? null,
  };

  return {
    id: entry.id ?? '',
    action: entry.action ?? '',
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    actor,
    metadata: entry.metadata ?? null,
    createdAt:
      entry.createdAt instanceof Date
        ? entry.createdAt.toISOString()
        : typeof entry.createdAt === 'string'
          ? entry.createdAt
          : null,
    target: entry.target ?? null,
  };
}

function normalizeAuditResult(result: AuditListResult, page: number, pageSize: number) {
  const items = Array.isArray(result) ? result : result.items ?? [];
  const total = Array.isArray(result) ? items.length : typeof result.total === 'number' ? result.total : items.length;
  const resolvedPage = Array.isArray(result) ? page : typeof result.page === 'number' ? result.page : page;
  const resolvedPageSize = Array.isArray(result)
    ? pageSize
    : typeof result.pageSize === 'number'
      ? result.pageSize
      : pageSize;

  return {
    items: items.map(normalizeAuditEntry),
    pagination: {
      page: resolvedPage,
      pageSize: resolvedPageSize,
      total,
    },
  };
}

const auditRoutes: FastifyPluginAsync = async (fastify) => {
  const deps = fastify as typeof fastify & RouteDependencies;
  const auditService = deps.services?.audit;
  const listAuditLogs = auditService?.listAuditLogs ?? auditService?.getAuditLogs;

  fastify.get<{ Querystring: AuditQuery }>('/audit', async (request, reply) => {
    if (!listAuditLogs) {
      return reply.code(501).send({
        error: 'Not Implemented',
        message: 'Audit service is not available',
      });
    }

    const page = toPositiveInt(request.query.page, DEFAULT_PAGE);
    const pageSize = clampPageSize(request.query.pageSize);

    const query = {
      page,
      pageSize,
      action: normalizeString(request.query.action),
      actorId: normalizeString(request.query.actorId),
      targetType: normalizeString(request.query.targetType),
      targetId: normalizeString(request.query.targetId),
      from: normalizeString(request.query.from),
      to: normalizeString(request.query.to),
      search: normalizeString(request.query.search),
    };

    const result = await listAuditLogs(query);
    return reply.send(normalizeAuditResult(result, page, pageSize));
  });
};

export default fp(auditRoutes, {
  name: 'audit-routes',
});
