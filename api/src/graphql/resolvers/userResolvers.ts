import type { GraphQLContext } from '../context';

type MaybeContext = Partial<GraphQLContext> & {
  userService?: {
    getCurrentUser?: (userId: string) => Promise<unknown>;
    getUserById?: (userId: string) => Promise<unknown>;
    listUsers?: (args?: Record<string, unknown>) => Promise<unknown>;
    updateUser?: (userId: string, input: Record<string, unknown>) => Promise<unknown>;
  };
  user?: {
    id?: string;
    userId?: string;
    sub?: string;
    [key: string]: unknown;
  };
  req?: {
    user?: {
      id?: string;
      userId?: string;
      sub?: string;
      [key: string]: unknown;
    };
  };
  services?: {
    userService?: {
      getCurrentUser?: (userId: string) => Promise<unknown>;
      getUserById?: (userId: string) => Promise<unknown>;
      listUsers?: (args?: Record<string, unknown>) => Promise<unknown>;
      updateUser?: (userId: string, input: Record<string, unknown>) => Promise<unknown>;
    };
  };
};

type ResolverArgs = Record<string, unknown>;

type UpdateMeArgs = {
  input?: Record<string, unknown>;
};

const getUserService = (context: MaybeContext) => {
  const service = context.userService ?? context.services?.userService;

  if (!service) {
    throw new Error('User service is not available');
  }

  return service;
};

const getAuthenticatedUserId = (context: MaybeContext): string => {
  const authUser = context.user ?? context.req?.user;
  const userId = authUser?.id ?? authUser?.userId ?? authUser?.sub;

  if (!userId || typeof userId !== 'string') {
    throw new Error('Authentication required');
  }

  return userId;
};

const userResolvers = {
  Query: {
    me: async (_parent: unknown, _args: ResolverArgs, context: MaybeContext) => {
      const userId = getAuthenticatedUserId(context);
      const userService = getUserService(context);

      if (typeof userService.getCurrentUser === 'function') {
        return userService.getCurrentUser(userId);
      }

      if (typeof userService.getUserById === 'function') {
        return userService.getUserById(userId);
      }

      throw new Error('User lookup is not available');
    },

    user: async (
      _parent: unknown,
      args: { id?: string },
      context: MaybeContext,
    ) => {
      const userService = getUserService(context);

      if (!args?.id) {
        throw new Error('User id is required');
      }

      if (typeof userService.getUserById !== 'function') {
        throw new Error('User lookup is not available');
      }

      return userService.getUserById(args.id);
    },

    users: async (
      _parent: unknown,
      args: ResolverArgs,
      context: MaybeContext,
    ) => {
      const userService = getUserService(context);

      if (typeof userService.listUsers !== 'function') {
        throw new Error('User listing is not available');
      }

      return userService.listUsers(args);
    },
  },

  Mutation: {
    updateMe: async (
      _parent: unknown,
      args: UpdateMeArgs,
      context: MaybeContext,
    ) => {
      const userId = getAuthenticatedUserId(context);
      const userService = getUserService(context);

      if (!args?.input || typeof args.input !== 'object') {
        throw new Error('Update input is required');
      }

      if (typeof userService.updateUser !== 'function') {
        throw new Error('User update is not available');
      }

      return userService.updateUser(userId, args.input);
    },
  },
};

export default userResolvers;
