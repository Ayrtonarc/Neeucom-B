// graphql/schema/video.js
const { gql } = require('apollo-server-express');

module.exports = gql`
    scalar Upload
    
    extend type Query {
        getAllVideos(cursor: String, limit: Int!): GetAllVideosV1
        getVideoById(id: String!): Video
    }
    
    extend type Mutation {
        addVideo(title: String!, description: String!, videoUrl: String!, thumbnailUrl: String!, userId: ID!): Video
        updateVideo(id: String!, title: String, description: String, videoUrl: String, thumbnailUrl: String): Video
        deleteVideo(id: String!): Video
        uploadVideo(file: Upload!, userId: ID!): Video
        deleteVideoFile(videoId: ID!): Video
    }
    type Video {
        id: ID!
        title: String!
        description: String
        url: String!
        createdAt: String!
        updatedAt: String!
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

