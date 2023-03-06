const { gql } = require('apollo-server-express');

module.exports = gql `
scalar Date

extend type Mutation {
    followUser(id: String!) : FollowResponse
}

type FollowResponse {
     id: String!
     
 }

`