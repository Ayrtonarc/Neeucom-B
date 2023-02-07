// graphql/resolvers/user.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { EMAIL_PATTERN } = require('../../utils/globalconstants');
const  {User}  = require('../../database/models');
const { Op } = require('sequelize');

module.exports = {

  Query: {
    async getAllUsers(root, args, context){
      let user = context;
      if(!user) throw new AuthenticationError('Required Auth');
      return await User.findAll();
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
  },
};