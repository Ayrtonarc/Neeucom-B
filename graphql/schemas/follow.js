const { gql } = require('apollo-server-express');

module.exports = gql `
scalar Date

extend type Mutation {
    followUser(id: String!) : FollowResponse
    unFollowUser(id: String) : unFollowResponse
}

type FollowResponse {
     followed: String!
     
 }
 
type unFollowResponse {
     id: String
}

`