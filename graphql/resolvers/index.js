// graphql/resolvers/index.js

const userResolvers = require('./user');
const messageResolvers =require('./message')


module.exports = [
    userResolvers,
    messageResolvers
];