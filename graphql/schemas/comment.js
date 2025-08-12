const { gql } = require('apollo-server-express');

module.exports = gql`
  type Comment {
    id: ID!
    content: String!
    user: User!
    video: Video!
    createdAt: String!
    updatedAt: String!
  }

  type CommentConnection {
    edges: [Comment!]!
    pageInfo: PageInfo!
  }

  type PageInfo {
    hasNextPage: Boolean!
    startCursor: String
    endCursor: String
  }

  extend type Query {
    commentsByVideo(videoId: ID!, limit: Int, cursor: String): CommentConnection!
  }

  extend type Mutation {
    addCommentToVideo(videoId: ID!, content: String!): Comment!
    deleteComment(commentId: ID!): Boolean!
  }
`;
