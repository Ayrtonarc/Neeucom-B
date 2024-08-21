// // graphql/context/index.js

// const { User } = require('../../database/models');
// const jwt = require('jsonwebtoken');
// const { AuthenticationError } = require('apollo-server-express')

// const verifyToken = async (token) => {
//   try {
//     if (!token) return null;
//     const { id } = await jwt.verify(token, 'mySecret');
//     const user = await User.findByPk(id);
//     return user;
//   } catch (error) {
//     throw new AuthenticationError(error.message);
//   }
// };

// module.exports = async ({ req }) => {
//   const token = (req.headers && req.headers.authorization)  || '' || 'Bearer ';
//    const user = await verifyToken(token)
//   return { user };
// };


const { User } = require('../../database/models');
const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('apollo-server-express');

const verifyToken = async (token) => {
  try {
    if (!token) return null;
    
    // Remueve el prefijo 'Bearer ' si está presente
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trimLeft();
    }

    const { id } = await jwt.verify(token, 'mySecret');
    const user = await User.findByPk(id);
    return user;
  } catch (error) {
    throw new AuthenticationError(error.message);
  }
};

module.exports = async ({ req }) => {
  const authHeader = req.headers.authorization || '';
  
  // Si el header es vacío, no pasa el token
  const token = authHeader ? authHeader : '';

  const user = await verifyToken(token);
  return { user };
};