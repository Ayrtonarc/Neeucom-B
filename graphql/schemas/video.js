// graphql/schema/video.js
const { gql } = require('apollo-server-express');

module.exports = gql`
    scalar Upload
    
    extend type Query {
        getAllVideos(cursor: String, limit: Int!): GetAllVideosV1
        getVideoById(id: String!): Video
        getAllMyVideos(cursor: String, limit: Int!): GetAllVideosV1
    }
    
    extend type Mutation {
        addVideo(title: String!, description: String!, file: Upload!): Video
        updateVideo(id: String!, title: String, description: String, thumbnailUrl: String): Video
        deleteVideo(id: String!): DeleteVideoResponse
        uploadVideo(file: Upload!, userId: ID!): Video
        deleteVideoFile(videoId: ID!): Video
    }
    
    type Video {
        id: ID!
        userId: ID!
        title: String!
        description: String
        videoUrl: String!
        thumbnailUrl: String
        views: String
        createdAt: String!
        updatedAt: String!
    }

    type AddVideoResponse {
        message: String!
    }
    type DeleteVideoResponse {
    message: String!
}

    type GetAllVideosV1 {
        edges: [Video]
        pageInfo: PageInfo!
    }

    type PageInfo {
        hasNextPage: Boolean!
        startCursor: String!
        endCursor: String!
    }
`;

