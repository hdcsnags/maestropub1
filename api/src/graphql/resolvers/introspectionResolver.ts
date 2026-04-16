import { GraphQLResolveInfo, graphql, getIntrospectionQuery } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';

type ResolverContext = Record<string, unknown>;

type IntrospectionArgs = {
  descriptions?: boolean;
  specifiedByUrl?: boolean;
  directiveIsRepeatable?: boolean;
  schemaDescription?: boolean;
  inputValueDeprecation?: boolean;
};

type IntrospectionResult = {
  data: unknown | null;
  errors: Array<{
    message: string;
    path?: readonly (string | number)[];
    extensions?: Record<string, unknown>;
  }>;
};

const passthroughTypeDefs = /* GraphQL */ `
  scalar JSON

  type IntrospectionResponse {
    data: JSON
    errors: JSON
  }

  extend type Query {
    introspection(
      descriptions: Boolean = true
      specifiedByUrl: Boolean = false
      directiveIsRepeatable: Boolean = false
      schemaDescription: Boolean = false
      inputValueDeprecation: Boolean = false
    ): IntrospectionResponse!
  }
`;

const jsonScalarResolver = {
  JSON: {
    __serialize(value: unknown) {
      return value;
    },
    __parseValue(value: unknown) {
      return value;
    },
    __parseLiteral() {
      return null;
    },
  },
};

function buildIntrospectionQuery(args: IntrospectionArgs): string {
  return getIntrospectionQuery({
    descriptions: args.descriptions ?? true,
    specifiedByUrl: args.specifiedByUrl ?? false,
    directiveIsRepeatable: args.directiveIsRepeatable ?? false,
    schemaDescription: args.schemaDescription ?? false,
    inputValueDeprecation: args.inputValueDeprecation ?? false,
  });
}

export const introspectionResolver = {
  typeDefs: passthroughTypeDefs,
  resolvers: {
    ...jsonScalarResolver,
    Query: {
      introspection: async (
        _parent: unknown,
        args: IntrospectionArgs,
        context: ResolverContext,
        info: GraphQLResolveInfo
      ): Promise<IntrospectionResult> => {
        const query = buildIntrospectionQuery(args);
        const schema = makeExecutableSchema({
          typeDefs: info.schema,
        });

        const result = await graphql({
          schema,
          source: query,
          contextValue: context,
        });

        return {
          data: result.data ?? null,
          errors: (result.errors ?? []).map((error) => ({
            message: error.message,
            path: error.path,
            extensions: error.extensions,
          })),
        };
      },
    },
  },
};

export default introspectionResolver;
