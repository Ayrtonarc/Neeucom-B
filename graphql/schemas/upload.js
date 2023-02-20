const { gql } = require("apollo-server-express");

module.exports = gql `
scalar Upload


    extend type Mutation {
        singleUpload(file: Upload!): SuccessMessage
       
    }
    type SuccessMessage {
        message: String
    }
`;
