const { gql } = require('apollo-server-express');

module.exports = gql `
scalar Date

extend type Mutation {
    follow(follow: String!) : FollowResponse
}

`