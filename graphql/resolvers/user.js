// graphql/resolvers/user.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { EMAIL_PATTERN, USERNAME_VALIDATOR } = require('../../utils/globalconstants');
const  {User}  = require('../../database/models');
const { GraphQLUpload } = require('graphql-upload');
const path = require('path');
const fs = require('fs');
const { finished } = require('stream/promises'); // Importa finis
const { uploadProfilePictureToSpaces, deleteProfilePictureFromSpaces } = require('../../services/digitalocean'); 
const streamToBuffer = require('stream-to-buffer');


const { Op, where } = require('sequelize');
const { fromCursorHash, toCursorHash} = require('../../utils/cursors');
const { log } = require('console');

module.exports = {
  Upload: GraphQLUpload, //Soporte para archivos


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
    },



    async uploadProfilePicture(root, args, context) {
      const { user } = context;
      if (!user) throw new AuthenticationError('Required Auth');
      try {
        const { createReadStream, filename, mimetype } = await args.file;
        if (!mimetype.startsWith('image/')) {
          throw new Error('El archivo debe ser una imagen');
        }
        const stream = createReadStream();
        const fileBuffer = await new Promise((resolve, reject) => {
          streamToBuffer(stream, (err, buffer) => {
            if (err) return reject(err);
            resolve(buffer);
          });
        });
        // Validación del tamaño máximo (5 MB)
        const maxFileSize = 5 * 1024 * 1024; // 5 MB en bytes
        if (fileBuffer.length > maxFileSize) {
          throw new Error('El tamaño del archivo supera el límite permitido de 5 MB');
        }
        // Eliminar la foto anterior si no es la default
        const currentUser = await User.findOne({ where: { id: user.id } });
        const defaultAvatar = 'https://neeucomdos.sfo2.cdn.digitaloceanspaces.com/default-avatar.webp';
        if (currentUser && currentUser.profilePicture && currentUser.profilePicture !== defaultAvatar) {
          const spacesUrl = process.env.DO_ENDPOINT.replace(/\/$/, ''); // quita slash final si lo hay
          const profileUrl = currentUser.profilePicture.replace(/\/+$/, ''); // quita slash final si lo hay
          let oldKey = null;
          if (profileUrl.startsWith(spacesUrl + '/')) {
            oldKey = profileUrl.substring(spacesUrl.length + 1);
          }
          if (oldKey && oldKey.trim() !== '') {
            try {
              await deleteProfilePictureFromSpaces(oldKey);
            } catch (err) {
              // No detener el flujo si falla el borrado, solo loguear si es necesario
            }
          }
        }
        const key = `userProfilePictures/user_${user.id}/profile_picture_${Date.now()}_${filename}`;
        // Subida robusta a Spaces
        let publicUrl;
        try {
          publicUrl = await uploadProfilePictureToSpaces(key, fileBuffer, mimetype);
        } catch (err) {
          throw new Error('No se pudo subir la imagen a Spaces. Intenta de nuevo más tarde.');
        }
        // Actualiza la URL en la base de datos
        try {
          await User.update({ profilePicture: publicUrl }, { where: { id: user.id } });
        } catch (err) {
          throw new Error('No se pudo actualizar la imagen de perfil en la base de datos.');
        }
        // Devuelve el usuario actualizado
        const updatedUser = await User.findOne({ where: { id: user.id } });
        if (!updatedUser) {
          throw new Error('User not found');
        }
        return updatedUser;
      } catch (err) {
        throw err;
      }
    },

    async deleteProfilePicture(root, args, context) {
      const { user } = context;
      if (!user) throw new AuthenticationError('Required Auth');
      const defaultAvatar = 'https://neeucomdos.sfo2.cdn.digitaloceanspaces.com/default-avatar.webp';
      // Obtener el usuario actual desde la base de datos
      const currentUser = await User.findOne({ where: { id: user.id } });
      if (!currentUser) throw new Error('User not found');
      // Si el usuario tiene una foto personalizada, eliminarla de Spaces
      if (currentUser.profilePicture && currentUser.profilePicture !== defaultAvatar) {
        const spacesUrl = process.env.DO_ENDPOINT.replace(/\/$/, '');
        const profileUrl = currentUser.profilePicture.replace(/\/+$/, '');
        let oldKey = null;
        if (profileUrl.startsWith(spacesUrl + '/')) {
          oldKey = profileUrl.substring(spacesUrl.length + 1);
        }
        if (oldKey && oldKey.trim() !== '') {
          try {
            await deleteProfilePictureFromSpaces(oldKey);
          } catch (err) {
            // Loguear el error pero no detener el flujo
            console.error('Error al borrar la foto de perfil en Spaces:', err);
          }
        }
      }
      // Actualizar la foto de perfil a la imagen por defecto en la base de datos
      await User.update({ profilePicture: defaultAvatar }, { where: { id: user.id } });
      // Retornar el usuario actualizado
      const updatedUser = await User.findOne({ where: { id: user.id } });
      if (!updatedUser) throw new Error('User not found');
      return updatedUser;
    }
    
      
    
  },
};