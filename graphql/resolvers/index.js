// graphql/resolvers/index.js

const userResolvers = require('./user');
const messageResolvers =require('./message');
const followResolvers = require('./follow');

module.exports = [
    userResolvers,
    messageResolvers,
    followResolvers,

];