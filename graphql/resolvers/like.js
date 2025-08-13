const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { User, Video, Like } = require('../../database/models');

module.exports = {
  Query: {
    async getLikesCount(root, args, context) {
      const { videoId } = args;
      
      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new UserInputError('Video no encontrado');
      }
      
      const count = await Like.count({ where: { videoId } });
      
      return {
        videoId,
        count
      };
    },
    
    async getUserLikeStatus(root, args, context) {
      const { user } = context;
      const { videoId } = args;
      
      if (!user) throw new AuthenticationError('Se requiere autenticación');
      
      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new UserInputError('Video no encontrado');
      }
      
      const like = await Like.findOne({
        where: { userId: user.id, videoId }
      });
      
      return {
        videoId,
        isLiked: !!like
      };
    }
  },
  
  Mutation: {
    async toggleLike(root, args, context) {
      const { user } = context;
      const { videoId } = args;
      
      if (!user) throw new AuthenticationError('Se requiere autenticación');
      
      const video = await Video.findByPk(videoId);
      if (!video) {
        throw new UserInputError('Video no encontrado');
      }
      
      const existingLike = await Like.findOne({
        where: { userId: user.id, videoId }
      });
      
      let isLiked;
      let message;
      
      if (existingLike) {
        await existingLike.destroy();
        isLiked = false;
        message = 'Like removido';
      } else {
        await Like.create({ userId: user.id, videoId });
        isLiked = true;
        message = 'Like agregado';
      }
      
      const likesCount = await Like.count({ where: { videoId } });
      
      return {
        success: true,
        message,
        isLiked,
        likesCount
      };
    }
  }
};
