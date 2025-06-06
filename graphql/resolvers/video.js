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
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/videos');

// Ensure uploads directory exists
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function generateUniqueFilename() {
    const timestamp = Date.now(); // Marca de tiempo actual
    return `${timestamp}.mp4`; // Solo el timestamp con la extensión .mp4
}

async function validateVideoInput(title, description, file) {
    if (!title || typeof title !== 'string' || title.trim() === '') {
        throw new UserInputError('El título es obligatorio y debe ser una cadena no vacía');
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
        throw new UserInputError('La descripción es obligatoria y debe ser una cadena no vacía');
    }

    if (!file || typeof file !== 'object') {
        throw new UserInputError('El archivo es obligatorio y debe ser un objeto válido');
    }

    const { filename, mimetype, createReadStream } = await file;
    if (!filename || !mimetype || !createReadStream) {
        throw new UserInputError('El archivo no es válido');
    }

    const allowedMimeTypes = ['video/mp4', 'video/avi', 'video/mkv'];
    if (!allowedMimeTypes.includes(mimetype)) {
        throw new UserInputError('El tipo de archivo no es válido. Solo se permiten videos.');
    }

    return { filename, mimetype, createReadStream };
}

async function saveFileToServer(createReadStream, filePath) {
    await new Promise((resolve, reject) => {
        const stream = createReadStream();
        const out = createWriteStream(filePath);
        stream.pipe(out);

        out.on('finish', () => {
            console.log(`✅ Archivo guardado físicamente en el servidor: ${filePath}`);
            resolve();
        });

        out.on('error', (err) => {
            console.error(`❌ Error al guardar el archivo en el servidor: ${filePath}`, err);
            reject(err);
        });
    });
}

async function uploadFileToSpaces(uniqueFilename, filePath, mimetype) {
    const fileBuffer = fs.readFileSync(filePath);
    let videoUrl;
    try {
        videoUrl = await uploadVideoToSpaces(uniqueFilename, fileBuffer, mimetype);
    } catch (error) {
        console.error('Error al subir el archivo a Spaces:', error);
        fs.unlinkSync(filePath); // Eliminar archivo local
        throw new Error('Error al subir el archivo a DigitalOcean Spaces');
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Error al eliminar el archivo local: ${filePath}`, err);
        } else {
            console.log(`Archivo local eliminado: ${filePath}`);
        }
    });

    return videoUrl;
}

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

            // Validar entrada
            await validateVideoInput(title, description, file);

            const { mimetype, createReadStream } = await file;

            // Guardar en subcarpeta userVideoFeed
            const uniqueFilename = generateUniqueFilename();
            const filePath = path.join(UPLOADS_DIR, 'userVideoFeed', uniqueFilename);

            // Asegura que la subcarpeta exista
            fs.mkdirSync(path.dirname(filePath), { recursive: true });

            console.log(`[addVideo] Usuario autenticado: ${context.user.id}`);
            console.log(`[addVideo] Subiendo archivo a Spaces con nombre: userVideoFeed/${uniqueFilename}`);

            // Guardar archivo en el servidor
            await saveFileToServer(createReadStream, filePath);

            // Subir archivo a Spaces
            await uploadFileToSpaces(`userVideoFeed/${uniqueFilename}`, filePath, mimetype);

            // No guardamos en la base de datos ni devolvemos el objeto Video
            return { message: 'El video se ha subido correctamente.' };
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