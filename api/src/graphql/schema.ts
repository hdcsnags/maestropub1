import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type Health {
    status: String!
    timestamp: DateTime!
    uptime: Float!
    service: String!
    version: String
    environment: String
  }

  type Query {
    health: Health!
  }
`;

export default typeDefs;
