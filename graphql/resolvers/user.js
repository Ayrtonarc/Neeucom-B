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
const uploadToSpaces = require('../../services/digitalocean');
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
    
      const key = `user_${user.id}/profile_picture_${Date.now()}_${filename}`;
      const publicUrl = await uploadToSpaces(key, fileBuffer, mimetype);
    
      // Actualiza la URL en la base de datos
      await User.update({ profilePicture: publicUrl }, { where: { id: user.id } });
    
      // Devuelve el usuario actualizado (o solo la URL, según necesites)
      const updatedUser = await User.findOne({ where: { id: user.id } });
      if (!updatedUser) {
        throw new Error('User not found');
      }
    
      return updatedUser;
    }
    

    // async uploadProfilePicture(root, args, context) {
    //   const { user } = context;
    //   if (!user) throw new AuthenticationError('Required Auth');
    
    //   const { createReadStream, filename, mimetype } = await args.file;
    
    //   // Verificar que el archivo sea una imagen
    //   if (!mimetype.startsWith('image/')) {
    //     throw new Error('El archivo debe ser una imagen');
    //   }
    
    //   // Convertir el stream a buffer
    //   const stream = createReadStream();
    //   const fileBuffer = await new Promise((resolve, reject) => {
    //     const chunks = [];
    //     stream.on('data', (chunk) => chunks.push(chunk));
    //     stream.on('end', () => resolve(Buffer.concat(chunks)));
    //     stream.on('error', (err) => reject(err));
    //   });
    
    //   // Definir la ruta en DigitalOcean Spaces
    //   const key = `user_${user.id}/profile_picture_${Date.now()}_${filename}`;
    
    //   // Subir la imagen y obtener la URL pública
    //   const publicUrl = await uploadToSpaces(key, fileBuffer, mimetype);
    
    //   // Actualizar la URL de la imagen en la base de datos
    //   await User.update({ profilePicture: publicUrl }, { where: { id: user.id } });
    
    //   // Obtener la información actualizada del usuario
    //   const updatedUser = await User.findOne({ where: { id: user.id } });
    
    //   return updatedUser;
    // }

    // async uploadProfilePicture(root, { file }, context) {
    //   const { user } = context;
    //   if (!user) throw new AuthenticationError('Required Auth');

    //   // Procesar el archivo subido
    //   const { createReadStream, filename, mimetype } = await file;

    //   // Verificamos que el archivo sea una imagen
    //   if (!mimetype.startsWith('image/')) {
    //     throw new Error('El archivo debe ser una imagen');
    //   }

    //   // Construir la ruta donde se guardará el archivo
    //   const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitiza el nombre del archivo
    //   const filePath = path.join(__dirname, 'uploads/profile_images', `${user.id}_${sanitizedFilename}`);

    //   // Crear el directorio si no existe
    //   const dir = path.dirname(filePath);
    //   if (!fs.existsSync(dir)) {
    //     fs.mkdirSync(dir, { recursive: true });
    //   }

    //   // Guardar la imagen en el servidor
    //   const stream = createReadStream();
    //   const out = createWriteStream(filePath);

    //   try {
    //     stream.pipe(out);
    //     await finished(out);
    //   } catch (error) {
    //     throw new Error('Error al guardar la imagen en el servidor');
    //   }

    //   // Actualizar la información del usuario con la ruta de la imagen
    //   await User.update({ profileImage: filePath }, { where: { id: user.id } });

    //   // Obtener la información actualizada del usuario
    //   const updatedUser = await User.findOne({ where: { id: user.id } });

    //   return updatedUser;
    // },
  },
};