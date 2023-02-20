// graphql/schemas/index.js

const { gql } = require('apollo-server-express');
const userType = require('./user');
const messageType = require('./message');
const uploadType = require('./upload')

const rootType = gql`
 type Query {
     root: String
 }
 type Mutation {
     root: String
 }

`;

module.exports = [
    rootType,
    userType,
    messageType,
    uploadType

    ];