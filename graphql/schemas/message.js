const { gql } = require('apollo-server-express');

module.exports = gql`
  scalar Date

  enum MessageStatus {
    sent
    read
  }

  type MessageResponse {
    id: String!
    content: String!
    senderId: String!
    recipientId: String!
    status: MessageStatus!
    createdAt: Date
    updatedAt: Date
    sender: UserResponse
    recipient: UserResponse
  }

  extend type Query {
    getMessages(otherUserId: String!): [MessageResponse]
  }

  extend type Mutation {
    sendMessage(content: String!, recipientId: String!): MessageResponse
    markAsRead(messageId: String!): MessageResponse
  }

  type UserResponse {
    id: String!
    username: String!
    firstname: String
    lastname: String
  }
`;
