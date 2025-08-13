// graphql/resolvers/index.js

const userResolvers = require('./user');
const messageResolvers =require('./message');
const followResolvers = require('./follow');
const videoResolvers = require('./video');
const likeResolvers = require('./like');

module.exports = [
    userResolvers,
    messageResolvers,
    followResolvers,
    videoResolvers,
    likeResolvers
];
