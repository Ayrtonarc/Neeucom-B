const { gql } = require('apollo-server-express');

module.exports = gql `
scalar Date

extend type Query {
    following(id: String) : [GenericResponse]
}


extend type Mutation {
    followUser(id: String!) : FollowResponse
    unFollowUser(id: String) : unFollowResponse
}

type FollowResponse {
     followed: String!
     
 }
 
type unFollowResponse {
    
    success: Boolean
    msg: String
}

type GenericResponse {
        followed: String!,
        success: Boolean,
        data: String,
        msg: String
    }

`