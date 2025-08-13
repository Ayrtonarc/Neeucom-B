const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { User, Message } = require('../../database/models');
const { Op } = require('sequelize');

module.exports = {
  Query: {
    async getMessages(root, args, context) {
      const { user } = context;
      const { otherUserId } = args;
      
      if (!user) throw new AuthenticationError('Se requiere autenticación');
      
      const otherUser = await User.findByPk(otherUserId);
      if (!otherUser) throw new UserInputError('Usuario no encontrado');
      
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: user.id, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: user.id }
          ]
        },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'firstname', 'lastname'] },
          { model: User, as: 'recipient', attributes: ['id', 'username', 'firstname', 'lastname'] }
        ],
        order: [['createdAt', 'ASC']]
      });
      
      return messages;
    }
  },
  
  Mutation: {
    async sendMessage(root, args, context) {
      const { user } = context;
      const { content, recipientId } = args;
      
      if (!user) throw new AuthenticationError('Se requiere autenticación');
      
      if (!content || content.trim() === '') {
        throw new UserInputError('El contenido del mensaje no puede estar vacío');
      }
      
      const recipient = await User.findByPk(recipientId);
      if (!recipient) {
        throw new UserInputError('Usuario destinatario no encontrado');
      }
      
      if (user.id === recipientId) {
        throw new UserInputError('No puedes enviarte mensajes a ti mismo');
      }
      
      const newMessage = await Message.create({
        senderId: user.id,
        recipientId,
        content: content.trim(),
        status: 'sent'
      });
      
      const messageWithAssociations = await Message.findByPk(newMessage.id, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'firstname', 'lastname'] },
          { model: User, as: 'recipient', attributes: ['id', 'username', 'firstname', 'lastname'] }
        ]
      });
      
      return messageWithAssociations;
    },
    
    async markAsRead(root, args, context) {
      const { user } = context;
      const { messageId } = args;
      
      if (!user) throw new AuthenticationError('Se requiere autenticación');
      
      const message = await Message.findByPk(messageId);
      if (!message) {
        throw new UserInputError('Mensaje no encontrado');
      }
      
      if (message.recipientId !== user.id) {
        throw new AuthenticationError('Solo el destinatario puede marcar el mensaje como leído');
      }
      
      if (message.status === 'read') {
        throw new UserInputError('El mensaje ya está marcado como leído');
      }
      
      await message.update({ status: 'read' });
      
      const updatedMessage = await Message.findByPk(messageId, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'firstname', 'lastname'] },
          { model: User, as: 'recipient', attributes: ['id', 'username', 'firstname', 'lastname'] }
        ]
      });
      
      return updatedMessage;
    }
  }
};
