const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const  {User, Follow}  = require('../../database/models');
const { Op, where } = require('sequelize');
const { fromCursorHash, toCursorHash} = require('../../utils/cursors');


module.exports = {
    Mutation: {
       async followUser(root, args, context){
        let { user } = context;
        let  { id }  = args;
        console.log("Dezzeer---",JSON.parse(JSON.stringify(user,null,4)));
        if(!user) throw new AuthenticationError('Se requiere autenticacion');
        

        let newFollow = await Follow.create({user: user.id, followed: id})
        
        
        return newFollow;
        
       }
    }
}



// Guardar un follow

//obtener los datos por un body

//sacar el id del usuario identificado

//crear objeto con el modelo follow

//guardar objeto en la bdd