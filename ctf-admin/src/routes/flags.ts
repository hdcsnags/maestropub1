import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const listFlagsQuerySchema = z.object({
  challengeId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
});

const createFlagBodySchema = z.object({
  challengeId: z.coerce.number().int().positive(),
  value: z.string().min(1).max(1024),
  caseSensitive: z.coerce.boolean().optional().default(false),
  isRegex: z.coerce.boolean().optional().default(false),
  isActive: z.coerce.boolean().optional().default(true),
});

const updateFlagParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const updateFlagBodySchema = z
  .object({
    challengeId: z.coerce.number().int().positive().optional(),
    value: z.string().min(1).max(1024).optional(),
    caseSensitive: z.coerce.boolean().optional(),
    isRegex: z.coerce.boolean().optional(),
    isActive: z.coerce.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

const deleteFlagParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

function getPrisma(app: FastifyInstance): any {
  return (app as any).prisma ?? (app as any).db ?? (app as any).orm;
}

function getAuthPreHandler(app: FastifyInstance): any {
  return (app as any).authenticate ?? (app as any).auth;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  return undefined;
}

export default async function flagsRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma(app);
  const authPreHandler = getAuthPreHandler(app);

  app.get(
    '/flags',
    {
      preHandler: authPreHandler,
    },
    async (request, reply) => {
      const parsed = listFlagsQuerySchema.safeParse(request.query);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Invalid query parameters',
          details: parsed.error.flatten(),
        });
      }

      if (!prisma?.flag) {
        return reply.code(500).send({ error: 'Flags data source not available' });
      }

      const { challengeId, page, pageSize } = parsed.data;
      const where = challengeId ? { challengeId } : {};
      const skip = (page - 1) * pageSize;

      const [items, total] = await Promise.all([
        prisma.flag.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { id: 'desc' },
          include: prisma.challenge ? { challenge: true } : undefined,
        }),
        prisma.flag.count({ where }),
      ]);

      return reply.send({
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      });
    },
  );

  app.post(
    '/flags',
    {
      preHandler: authPreHandler,
    },
    async (request, reply) => {
      const parsed = createFlagBodySchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Invalid request body',
          details: parsed.error.flatten(),
        });
      }

      if (!prisma?.flag) {
        return reply.code(500).send({ error: 'Flags data source not available' });
      }

      const body = parsed.data;

      if (prisma.challenge) {
        const challenge = await prisma.challenge.findUnique({
          where: { id: body.challengeId },
          select: { id: true },
        });

        if (!challenge) {
          return reply.code(404).send({ error: 'Challenge not found' });
        }
      }

      const created = await prisma.flag.create({
        data: {
          challengeId: body.challengeId,
          value: body.value,
          caseSensitive: body.caseSensitive,
          isRegex: body.isRegex,
          isActive: body.isActive,
        },
      });

      return reply.code(201).send(created);
    },
  );

  app.patch(
    '/flags/:id',
    {
      preHandler: authPreHandler,
    },
    async (request, reply) => {
      const paramsParsed = updateFlagParamsSchema.safeParse(request.params);
      if (!paramsParsed.success) {
        return reply.code(400).send({
          error: 'Invalid route parameters',
          details: paramsParsed.error.flatten(),
        });
      }

      const bodyParsed = updateFlagBodySchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.code(400).send({
          error: 'Invalid request body',
          details: bodyParsed.error.flatten(),
        });
      }

      if (!prisma?.flag) {
        return reply.code(500).send({ error: 'Flags data source not available' });
      }

      const id = paramsParsed.data.id;
      const body = bodyParsed.data;

      const existing = await prisma.flag.findUnique({ where: { id } });
      if (!existing) {
        return reply.code(404).send({ error: 'Flag not found' });
      }

      if (body.challengeId && prisma.challenge) {
        const challenge = await prisma.challenge.findUnique({
          where: { id: body.challengeId },
          select: { id: true },
        });

        if (!challenge) {
          return reply.code(404).send({ error: 'Challenge not found' });
        }
      }

      const updated = await prisma.flag.update({
        where: { id },
        data: {
          ...(body.challengeId !== undefined ? { challengeId: body.challengeId } : {}),
          ...(body.value !== undefined ? { value: body.value } : {}),
          ...(body.caseSensitive !== undefined
            ? { caseSensitive: parseBoolean(body.caseSensitive) ?? body.caseSensitive }
            : {}),
          ...(body.isRegex !== undefined ? { isRegex: parseBoolean(body.isRegex) ?? body.isRegex } : {}),
          ...(body.isActive !== undefined ? { isActive: parseBoolean(body.isActive) ?? body.isActive } : {}),
        },
      });

      return reply.send(updated);
    },
  );

  app.delete(
    '/flags/:id',
    {
      preHandler: authPreHandler,
    },
    async (request, reply) => {
      const parsed = deleteFlagParamsSchema.safeParse(request.params);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Invalid route parameters',
          details: parsed.error.flatten(),
        });
      }

      if (!prisma?.flag) {
        return reply.code(500).send({ error: 'Flags data source not available' });
      }

      const { id } = parsed.data;
      const existing = await prisma.flag.findUnique({ where: { id } });

      if (!existing) {
        return reply.code(404).send({ error: 'Flag not found' });
      }

      await prisma.flag.delete({ where: { id } });

      return reply.code(204).send();
    },
  );
}
