const { gql } = require('apollo-server-express');

module.exports = gql`
  extend type Query {
    getLikesCount(videoId: String!): LikesCountResponse
    getUserLikeStatus(videoId: String!): UserLikeStatusResponse
  }
  
  extend type Mutation {
    toggleLike(videoId: String!): ToggleLikeResponse
  }
  
  type LikesCountResponse {
    videoId: String!
    count: Int!
  }
  
  type UserLikeStatusResponse {
    videoId: String!
    isLiked: Boolean!
  }
  
  type ToggleLikeResponse {
    success: Boolean!
    message: String!
    isLiked: Boolean!
    likesCount: Int!
  }
`;
