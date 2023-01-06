const jwt = require('jsonwebtoken')
const { AuthenticationError, UserInputError} = require('apollo-server-express');
const {User, Message } = require ('../../database/models');

module.exports = {

    Query: {
        async getAllMessages (root, args, context){
            let { user } = context;
            if(!user) throw new AuthenticationError('Se requiere autenticacion');

            const otherUser = await User.findOne({
                where : { username: from }
            })
            if(!otherUser) throw new UserInputError('Usuario no existe');
            



            let myMessages = await Message.findAll({
                where: { username: user.from}
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
            console.log("Zahori-----------", JSON.stringify(user,null,4))
            return newmessage;

            
            


        }
    }
}