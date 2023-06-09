const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const  {User, Follow}  = require('../../database/models');
const { Op, where } = require('sequelize');
const { fromCursorHash, toCursorHash} = require('../../utils/cursors');


module.exports = {
    Query: {
        //obtener usuarios que sigue un usuario  
        async getFollowing(root, args, context){
            let { user } = context;
            let { id } = args;
            
            if(!user) throw new AuthenticationError('Se requiere autenticacion');

            // if(!userId) throw new UserInputError('El id no existe');

            
            let followingUsers = await User.findAll({
                where: { user: id },
                include: [
                  {
                    model: Follow,
                    as: 'followed',
                    include: [
                      {
                        model: User,
                        as: 'following',
                        attributes: ['id', 'username', 'firstname', 'lastname', 'bio'],
                        include: [
                          {
                            model: Follow,
                            as: 'followers',
                            where: { user: id },
                            required: false
                          }
                        ]
                      }
                    ]
                  }
                ]
              });
              console.log("Dezzeer---", JSON.parse(JSON.stringify(followingUsers, null, 4)));
              return followingUsers;
              
              
              
              
              
              
              
            // let followingUsers  = await Follow.findAll({
            //     where: { user: id },
            //     include: [{ 
            //         attributes: ['id', 'username', 'firstname', 'lastname','bio'],
            //         model: User, required: true, as: 'followers',
            //         include: [{ model: Follow, as: 'followwer', required: false, where: { user: id } }] 
            //     }]
            // });
            // console.log("Dezzeer---",JSON.parse(JSON.stringify(followingUsers,null,4)));
            // return followingUsers;

        },
        // async followers(root, args, contex){
        //usuarios que me siguen
        // }

    },

    Mutation: {
       async followUser(root, args, context){
        let { user } = context;
        let  { id }  = args;
        //console.log("Dezzeer---",JSON.parse(JSON.stringify(user,null,4)));
        if(!user) throw new AuthenticationError('Se requiere autenticacion');
        

        let newFollow = await Follow.create({userId: user.id, followerId: id})
        
        let followedUser = await Follow.findOne({where: { followerId: id }})
        return followedUser;
        
       },


       async unFollowUser(root, args, context){
        let { user } = context;
        if(!user) throw new AuthenticationError('Se requiere autenticacion');
        let { id } = args;

        await Follow.destroy({ where: { followed: id }});
        return {
            success: true,
            msg: "Se dejo de seguir este usuario",
          };
       }
    }

}



// Guardar un follow

//obtener los datos por un body

//sacar el id del usuario identificado

//crear objeto con el modelo follow

//guardar objeto en la bdd