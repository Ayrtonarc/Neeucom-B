// graphql/schemas/index.js

const { gql } = require('apollo-server-express');
const userType = require('./user');
const messageType = require('./message');
const followType = require('./follow')

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
    followType
    ];