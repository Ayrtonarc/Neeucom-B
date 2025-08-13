const { Comment, User, Video } = require('../../database/models');
const { AuthenticationError, UserInputError } = require('apollo-server-express');

module.exports = {
  Query: {
    async commentsByVideo(_, { videoId, limit = 10, cursor }, context) {
      // Paginación simple basada en createdAt
      const where = { videoId };
      if (cursor) {
        where.createdAt = { $lt: new Date(parseInt(cursor, 10)) };
      }
      const comments = await Comment.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
        include: [
          { model: User, as: 'user' },
          { model: Video, as: 'video' },
        ],
      });
      const hasNextPage = comments.length > limit;
      const edges = hasNextPage ? comments.slice(0, -1) : comments;
      return {
        edges,
        pageInfo: {
          hasNextPage,
          startCursor: edges.length > 0 ? String(new Date(edges[0].createdAt).getTime()) : null,
          endCursor: edges.length > 0 ? String(new Date(edges[edges.length - 1].createdAt).getTime()) : null,
        },
      };
    },
  },
  Mutation: {
    async addCommentToVideo(_, { videoId, content }, context) {
      // Log de argumentos recibidos
      console.log('addCommentToVideo args:', { videoId, content }, 'user:', context && context.user ? context.user.id : null);
      try {
        // Validación de usuario autenticado
        const user = context.user;
        if (!user) throw new AuthenticationError('Required Auth');

        // Validación de contenido
        if (!content || content.trim() === '') throw new UserInputError('El comentario no puede estar vacío');

        // Verificar que el video existe
        const video = await Video.findByPk(videoId);
        if (!video) throw new UserInputError('Video no encontrado');

        // Crear el comentario
        const comment = await Comment.create({
          content,
          userId: user.id,
          videoId,
        });
        console.log('Comentario guardado:', comment && comment.toJSON ? comment.toJSON() : comment);

        // Buscar el comentario recién creado con las relaciones
        const result = await Comment.findByPk(comment.id, {
          include: [
            { model: User, as: 'user' },
            { model: Video, as: 'video' },
          ],
        });
        console.log('Result to return:', result);
        if (!result) {
          console.error('No se pudo recuperar el comentario recién creado');
        }
        return result;
      } catch (err) {
        console.error('Error en addCommentToVideo:', err);
        throw err;
      }
    },
    async deleteComment(_, { commentId }, context) {
      const user = context.user;
      if (!user) throw new AuthenticationError('Required Auth');
      const comment = await Comment.findByPk(commentId);
      if (!comment) throw new UserInputError('Comentario no encontrado');
      if (comment.userId !== user.id) throw new AuthenticationError('Solo puedes borrar tus propios comentarios');
      await comment.destroy();
      return true;
    },
  },
};
