import { GraphQLError } from 'graphql';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

type ResolverContext = {
  user?: {
    id: string;
    email?: string | null;
    role?: string | null;
  } | null;
};

type CreateBoardArgs = {
  input?: {
    name?: string | null;
    description?: string | null;
  } | null;
  name?: string | null;
  description?: string | null;
};

type UpdateBoardArgs = {
  id: string;
  input?: {
    name?: string | null;
    description?: string | null;
  } | null;
  name?: string | null;
  description?: string | null;
};

type DeleteBoardArgs = {
  id: string;
};

type BoardIdArgs = {
  id: string;
};

const requireAuth = (context: ResolverContext) => {
  if (!context?.user?.id) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  return context.user.id;
};

const normalizeBoardPayload = <T extends { input?: { name?: string | null; description?: string | null } | null; name?: string | null; description?: string | null }>(
  args: T,
) => {
  const name = args.input?.name ?? args.name ?? null;
  const description = args.input?.description ?? args.description ?? null;

  return {
    name: typeof name === 'string' ? name.trim() : '',
    description: typeof description === 'string' ? description.trim() : null,
  };
};

const validateBoardName = (name: string) => {
  if (!name) {
    throw new GraphQLError('Board name is required', {
      extensions: { code: 'BAD_USER_INPUT', field: 'name' },
    });
  }

  if (name.length > 100) {
    throw new GraphQLError('Board name must be 100 characters or fewer', {
      extensions: { code: 'BAD_USER_INPUT', field: 'name' },
    });
  }
}
;

const ensureBoardAccess = async (boardId: string, userId: string) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    },
  });

  if (!board) {
    throw new GraphQLError('Board not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  return board;
};

const ensureBoardOwnership = async (boardId: string, userId: string) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      ownerId: userId,
    },
  });

  if (!board) {
    throw new GraphQLError('Board not found or insufficient permissions', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return board;
};

const boardInclude = {
  owner: true,
  members: {
    include: {
      user: true,
    },
  },
  lists: {
    orderBy: {
      position: 'asc' as const,
    },
    include: {
      cards: {
        orderBy: {
          position: 'asc' as const,
        },
      },
    },
  },
} satisfies Prisma.BoardInclude;

export const boardResolvers = {
  Query: {
    boards: async (_parent: unknown, _args: unknown, context: ResolverContext) => {
      const userId = requireAuth(context);

      return prisma.board.findMany({
        where: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
        include: boardInclude,
        orderBy: {
          createdAt: 'desc',
        },
      });
    },

    board: async (_parent: unknown, args: BoardIdArgs, context: ResolverContext) => {
      const userId = requireAuth(context);
      await ensureBoardAccess(args.id, userId);

      return prisma.board.findUnique({
        where: { id: args.id },
        include: boardInclude,
      });
    },
  },

  Mutation: {
    createBoard: async (_parent: unknown, args: CreateBoardArgs, context: ResolverContext) => {
      const userId = requireAuth(context);
      const { name, description } = normalizeBoardPayload(args);

      validateBoardName(name);

      return prisma.board.create({
        data: {
          name,
          description: description || null,
          ownerId: userId,
        },
        include: boardInclude,
      });
    },

    updateBoard: async (_parent: unknown, args: UpdateBoardArgs, context: ResolverContext) => {
      const userId = requireAuth(context);
      await ensureBoardOwnership(args.id, userId);

      const { name, description } = normalizeBoardPayload(args);
      validateBoardName(name);

      return prisma.board.update({
        where: { id: args.id },
        data: {
          name,
          description: description || null,
        },
        include: boardInclude,
      });
    },

    deleteBoard: async (_parent: unknown, args: DeleteBoardArgs, context: ResolverContext) => {
      const userId = requireAuth(context);
      await ensureBoardOwnership(args.id, userId);

      await prisma.board.delete({
        where: { id: args.id },
      });

      return true;
    },
  },

  Board: {
    owner: async (parent: { owner?: unknown; ownerId?: string }) => {
      if (parent.owner) {
        return parent.owner;
      }

      if (!parent.ownerId) {
        return null;
      }

      return prisma.user.findUnique({
        where: { id: parent.ownerId },
      });
    },

    members: async (parent: { members?: unknown; id: string }) => {
      if (parent.members) {
        return parent.members;
      }

      return prisma.boardMember.findMany({
        where: { boardId: parent.id },
        include: {
          user: true,
        },
      });
    },

    lists: async (parent: { lists?: unknown; id: string }) => {
      if (parent.lists) {
        return parent.lists;
      }

      return prisma.list.findMany({
        where: { boardId: parent.id },
        orderBy: {
          position: 'asc',
        },
        include: {
          cards: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      });
    },
  },
};

export default boardResolvers;
