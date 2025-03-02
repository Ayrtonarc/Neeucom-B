const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { EMAIL_PATTERN, USERNAME_VALIDATOR } = require('../../utils/globalconstants');
const { User } = require('../../database/models');
const { GraphQLUpload } = require('graphql-upload');
const { Mutation } = require('./follow');

module.exports = {
    Upload: GraphQLUpload, // Soporte para archivos

    Query: {
        async getAllVideos(root, args, context) {
            // Implementar lógica para obtener todos los videos
        },
        async getVideoById(root, args, context) {
            // Implementar lógica para obtener un video por ID
        },
    },
    Mutation: {
        async addVideo(root, args, context) {
            // Implementar lógica para agregar un video
        },
        async updateVideo(root, args, context) {
            // Implementar lógica para actualizar un video
        },
        async deleteVideo(root, args, context) {
            // Implementar lógica para eliminar un video
        },
        async uploadVideo(root, args, context) {
            // Implementar lógica para subir un video
        },
        async deleteVideoFile(root, args, context) {
            // Implementar lógica para eliminar un archivo de video
        },
    }
}
// La diferencia entre addVideo y uploadVideo es que addVideo se encarga de agregar la información del video a la base de datos, mientras que uploadVideo se encarga de subir el archivo del video al servidor o a un servicio de almacenamiento en la nube.