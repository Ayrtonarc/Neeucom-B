const jwt = require('jsonwebtoken')
const { AuthenticationError, UserInputError} = require('apollo-server-express');
const {User, Message } = require ('../../database/models');
const { Op } = require('sequelize')

module.exports = {

    Query: {
        async getMessages (root, args, context){
            let { user } = context;
            if(!user) throw new AuthenticationError('Se requiere autenticacion');

            const otherUser = await User.findOne({
                where : { username: args }
            })
            if(!otherUser) throw new UserInputError('Usuario no existe');
            
            const usernames = [user.username, otherUser.usernane ]


            let myMessages = await Message.findAll({
                where: { 
                    from: { [Op.in]: usernames},
                    to: {[Op.in]: usernames }

                },
                order: [['createdAt', 'DESC']],
            })

            return myMessages
        }
    },
    
    Mutation: {
        async sendMessage (root, args, context){
        let { user } = context;
           if(!user) throw new AuthenticationError('Se requiere autenticacion');
            
            const { text, to} = args;
            const userExist = await User.findOne({where: { username: to}});

            if(!userExist){
                throw new UserInputError('Usuario no existe')
            } 
            
            if(text.trim() === ''){
                throw new UserInputError('Mensaje esta vacio');
            }

            let newmessage = await Message.create({from: user.username, to, text
            

            })
           // console.log("Zahori-----------", JSON.stringify(user,null,4))
            return newmessage;

            
            


        }
    }
}