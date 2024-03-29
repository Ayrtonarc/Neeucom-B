// graphql/resolvers/user.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { EMAIL_PATTERN, USERNAME_VALIDATOR } = require('../../utils/globalconstants');
const  {User}  = require('../../database/models');

const { Op, where } = require('sequelize');
const { fromCursorHash, toCursorHash} = require('../../utils/cursors');

module.exports = {

  Query: {
    async getAllUsers(root, args, context){
      let { user } = context;
      if(!user) throw new AuthenticationError('Required Auth');
      const  { cursor, limit } = args;

      var cursorOptions  = cursor
      

      // paginacion basarse en el futuro en esto

      const paginatedUsers = await User.findAll({
        ...cursorOptions,
        limit: limit + 1,
        order: [ ['createdAt', 'DESC']],
      });

      const hasNextPage = paginatedUsers.lenght > limit;
      const edges = hasNextPage ? paginatedUsers.slice(0, -1) : paginatedUsers;
      const startCursor = edges.length > 0 ? edges[0].createdAt : '';

      return {
        edges,
        pageInfo: {
          hasNextPage,
          startCursor: toCursorHash(startCursor),
          endCursor: toCursorHash(edges[edges.length - 1]?.createdAt),
        },
      };
      //Paginacion
    },

    async getProfile(root, args, context){
      let user = context;
      if(!user) throw new AuthenticationError('Required Auth');
      return await User.findOne({where: {id: args.id}});
    }
  },

  Mutation: {
    async register(root, args, context) {
      let { firstname, lastname, username, email, password } = args;
      email = email.trim().toLowerCase();
      let user = await User.findOne({ where: { email } });
      if(user) throw new UserInputError("Este email ya esta registrado");
      if (!EMAIL_PATTERN.test(email)) throw new UserInputError("email no valido");
      //console.log("argsssss",args);

      let usrvalidation = await User.findOne({ where: { username }});
      if(usrvalidation) throw new UserInputError("Este username ya esta en uso");
      if (username && username?.length < 2 || username?.length>14) throw new UserInputError("Nombre de usuario invalido");
       if (!USERNAME_VALIDATOR.test(username)) throw new UserInputError("username no permite esos caracteres");
      return await User.create({firstname, lastname, username, email, password })
     },

    async login(root, args, context) {
      let { email, password } = args;
      email = email.trim().toLowerCase();

      let user = await User.findOne({ where: { email } });
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id }, 'mySecret');
        return { ...user.toJSON(), token };
      }
      throw new AuthenticationError('Invalid credentials');
    },

    async updateUserInfo(root, args, context){
      const { user } = context;
      if(!user) throw new AuthenticationError('Required Auth');
      //console.log("user",JSON.parse(JSON.stringify(user)));
      const {firstname,lastname, username, bio} = args;

      await User.update({firstname,lastname,username,bio}, {where:{ id: user.id} })


      //console.log("user",JSON.parse(JSON.stringify(updateUser)));
      //return updateUser;

      const updatedInfo = await User.findOne({where:{ id: user.id}})
      return updatedInfo;
    }
  },
};