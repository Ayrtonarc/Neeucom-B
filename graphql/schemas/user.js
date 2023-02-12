// graphql/schema/user.js

const { gql } = require('apollo-server-express');

module.exports = gql`



extend type Query {
    getAllUsers : [User]
    getProfile(id: String!) : User
}

 extend type Mutation {
     register(firstname: String!, lastname: String!, username: String!, password: String!, email: String! ): RegisterResponse
     login(email: String!, password: String!): LoginResponse
     updateUserInfo(firstname: String!, lastname: String!, username: String! bio: String!) : User

 }

 type User {
     id: String!
     firstname: String!
     lastname: String!
     username: String!
     email: String!
     bio: String!
 }

 type RegisterResponse {
    id: String!
    firstname: String
    lastname: String
    username: String
    email: String!
 }

  type LoginResponse {
    id: String!
    firstname: String!
    lastname: String!
    username: String!
    token: String!
 }

`;