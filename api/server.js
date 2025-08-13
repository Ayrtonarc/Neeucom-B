// api/server.js

const express = require('express');
const { createServer } = require('http');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const typeDefs = require('../graphql/schemas');
const resolvers = require('../graphql/resolvers');
const context = require('../graphql/context');
const { graphqlUploadExpress } = require('graphql-upload');
require('dotenv').config

const app = express();


app.use(cors());
app.use(graphqlUploadExpress());

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context,
  introspection: true,
  playground: {
    settings: {
      'schema.polling.enable': false,
    },
  },
});
apolloServer.start().then(async() => {
    await apolloServer.applyMiddleware({ app, path: apolloServer.graphqlPath });
});



const server = createServer(app);

module.exports = server;



/*
//a pollo server
apolloServer.start().then(async (res) => {
    await apolloServer.applyMiddleware({ app, path: apolloServer.graphqlPath });
    // app.listen(() => console.log(`Gateway API running at port: ${4002}`));
  });
*/



