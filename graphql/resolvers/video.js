const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { EMAIL_PATTERN, USERNAME_VALIDATOR } = require('../../utils/globalconstants');
const { User } = require('../../database/models');
const { GraphQLUpload } = require('graphql-upload');
const { Mutation } = require('./follow');
const { createWriteStream } = require('fs');
const path = require('path');
const { uploadVideoToSpaces } = require('../../services/digitaloceanvideo');

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
            const { title, description, file } = args;

            // Logs de depuración
            console.log('addVideo llamado con:');
            console.log('title:', title, ' (tipo:', typeof title, ')');
            console.log('description:', description, ' (tipo:', typeof description, ')');
            console.log('file:', file, ' (tipo:', typeof file, ')');

            // Validar que el usuario esté autenticado
            if (!context.user) {
                throw new AuthenticationError('Debes estar autenticado para agregar un video');
            }

            // Validar los datos de entrada
            if (!title || !description || !file) {
                console.log('Validación fallida: algún campo está ausente', { title: !!title, description: !!description, file: !!file });
                throw new UserInputError('Todos los campos son obligatorios');
            }

            // Verificar que el archivo no sea undefined
            if (!file) {
                throw new UserInputError('El archivo es obligatorio');
            }

            const { filename, mimetype, createReadStream } = await file;
            console.log('Archivo recibido:', { filename, mimetype, createReadStream: Boolean(createReadStream) });

            // Verificar que las propiedades del archivo no sean undefined
            if (!filename || !mimetype || !createReadStream) {
                throw new UserInputError('El archivo no es válido');
            }

            // Generar un nombre único para el archivo
            const uniqueFilename = `${Date.now()}-${filename}`;

            // Definir la ruta donde se guardará el archivo
            const filePath = path.join(__dirname, '../../uploads/videos', uniqueFilename);

            // Guardar el archivo en el servidor
            await new Promise((resolve, reject) => {
                const stream = createReadStream();
                const out = createWriteStream(filePath);
                stream.pipe(out);
                out.on('finish', resolve);
                out.on('error', reject);
            });

            // Subir el archivo a DigitalOcean Spaces
            const fileBuffer = await new Promise((resolve, reject) => {
                const chunks = [];
                const stream = createReadStream();
                stream.on('data', chunk => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });

            const videoUrl = await uploadVideoToSpaces(uniqueFilename, fileBuffer, mimetype);

            // Guardar la información del video en la base de datos
            const newVideo = await context.db.Video.create({
                title,
                description,
                filePath: videoUrl,
                mimetype,
                userId: context.user.id,
            });

            return newVideo;
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