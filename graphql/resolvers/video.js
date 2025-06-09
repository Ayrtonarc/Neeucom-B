const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { Video } = require('../../database/models');
const { GraphQLUpload } = require('graphql-upload');
const path = require('path');
const fs = require('fs');
const { uploadVideoToSpaces } = require('../../services/digitaloceanvideo');
const { createWriteStream } = require('fs');
const { fromCursorHash, toCursorHash } = require('../../utils/cursors');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/videos');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function generateUniqueFilename() {
    const timestamp = Date.now();
    return `${timestamp}.mp4`;
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
        fs.unlinkSync(filePath);
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
    Upload: GraphQLUpload,
    Query: {
        async getAllVideos(root, args, context) {
            // Paginación por cursor
            // limit: cuántos videos traer por página
            // cursor: base64 de createdAt del último video de la página anterior
            const { cursor, limit = 20 } = args || {};
            let where = {};
            if (cursor) {
                // Decodifica el cursor y filtra los videos creados antes de esa fecha
                const createdAtCursor = new Date(fromCursorHash(cursor));
                if (!isNaN(createdAtCursor)) {
                    where.createdAt = { $lt: createdAtCursor };
                }
            }
            // Trae limit + 1 videos para saber si hay siguiente página
            const videos = await Video.findAll({
                where,
                order: [['createdAt', 'DESC']],
                limit: limit + 1,
            });
            // Si hay más de limit videos, hay siguiente página
            const hasNextPage = videos.length > limit;
            // edges: videos a retornar (limit)
            const edges = hasNextPage ? videos.slice(0, -1) : videos;
            // pageInfo: información de paginación (cursors)
            return {
                edges,
                pageInfo: {
                    hasNextPage,
                    startCursor: edges.length > 0 ? toCursorHash(edges[0].createdAt.toISOString()) : '',
                    endCursor: edges.length > 0 ? toCursorHash(edges[edges.length - 1].createdAt.toISOString()) : '',
                },
            };
        },
        async getVideoById(root, args, context) {
            const { user } = context;
            if (!user || !user.id) {
                throw new AuthenticationError('Se requiere autenticación para ver el video');
            }
            const { id } = args;
            const video = await Video.findByPk(id);
            if (!video) {
                throw new UserInputError('Video no encontrado');
            }
            return video;
        },
        async getAllMyVideos(root, args, context) {
            const { user } = context;
            if (!user || !user.id) {
                throw new AuthenticationError('Se requiere autenticación para ver tus videos');
            }
            // Paginación por cursor para videos del usuario autenticado
            // limit: cuántos videos traer por página
            // cursor: base64 de createdAt del último video de la página anterior
            const { cursor, limit = 20 } = args || {};
            let where = { userId: user.id };
            if (cursor) {
                // Decodifica el cursor y filtra los videos creados antes de esa fecha
                const createdAtCursor = new Date(fromCursorHash(cursor));
                if (!isNaN(createdAtCursor)) {
                    where.createdAt = { $lt: createdAtCursor };
                }
            }
            // Trae limit + 1 videos para saber si hay siguiente página
            const videos = await Video.findAll({
                where,
                order: [['createdAt', 'DESC']],
                limit: limit + 1,
            });
            // Si hay más de limit videos, hay siguiente página
            const hasNextPage = videos.length > limit;
            // edges: videos a retornar (limit)
            const edges = hasNextPage ? videos.slice(0, -1) : videos;
            // pageInfo: información de paginación (cursors)
            return {
                edges,
                pageInfo: {
                    hasNextPage,
                    startCursor: edges.length > 0 ? toCursorHash(edges[0].createdAt.toISOString()) : '',
                    endCursor: edges.length > 0 ? toCursorHash(edges[edges.length - 1].createdAt.toISOString()) : '',
                },
            };
        },
    },
    Mutation: {
        async addVideo(root, args, context) {
            const { user } = context;
            if (!user || !user.id) {
                throw new AuthenticationError('Se requiere autenticación para agregar un video');
            }
            const { title, description, file } = args;

            // Validar entrada
            await validateVideoInput(title, description, file);

            const { mimetype, createReadStream } = await file;

            // Guardar en subcarpeta userVideoFeed
            const uniqueFilename = generateUniqueFilename();
            const filePath = path.join(UPLOADS_DIR, 'userVideoFeed', uniqueFilename);

            // Asegura que la subcarpeta exista
            fs.mkdirSync(path.dirname(filePath), { recursive: true });

            console.log(`[addVideo] Usuario autenticado: ${user.id}`);
            console.log(`[addVideo] Subiendo archivo a Spaces con nombre: userVideoFeed/${uniqueFilename}`);

            // Guardar archivo en el servidor
            await saveFileToServer(createReadStream, filePath);

            // Subir archivo a Spaces
            const videoUrl = await uploadFileToSpaces(`userVideoFeed/${uniqueFilename}`, filePath, mimetype);

            // Guardar en la base de datos
           const newVideo = await Video.create({
                title,
                description,
                userId: user.id,
                videoUrl,
                thumbnailUrl: '',
            });

            return newVideo;
        },
        async updateVideo(root, args, context) {
            const { user } = context;
            if (!user || !user.id) {
                throw new AuthenticationError('Se requiere autenticación para actualizar un video');
            }
            const { id, title, description, thumbnailUrl } = args;
            // Buscar el video y asegurarse que pertenece al usuario autenticado
            const video = await Video.findOne({ where: { id, userId: user.id } });
            if (!video) {
                throw new UserInputError('Video no encontrado o no tienes permisos para actualizarlo');
            }
            // Solo se pueden actualizar title, description y thumbnailUrl
            if (title !== undefined) video.title = title;
            if (description !== undefined) video.description = description;
            if (thumbnailUrl !== undefined) video.thumbnailUrl = thumbnailUrl;
            await video.save();
            return video;
        },
        async deleteVideo(root, args, context) {
            const { user } = context;
            if (!user || !user.id) {
                throw new AuthenticationError('Se requiere autenticación para eliminar un video');
            }
            const { id } = args;
            // Buscar el video y asegurarse que pertenece al usuario autenticado
            const video = await Video.findOne({ where: { id, userId: user.id } });
            if (!video) {
                throw new UserInputError('Video no encontrado o no tienes permisos para eliminarlo');
            }
            // Eliminar el archivo de Spaces si existe videoUrl
            if (video.videoUrl) {
                try {
                    const url = new URL(video.videoUrl);
                    const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                    const { deleteVideoFromSpaces } = require('../../services/digitaloceanvideo');
                    await deleteVideoFromSpaces(key);
                } catch (err) {
                    console.error('Error eliminando archivo en Spaces:', err);
                    // Puedes decidir si lanzar error o continuar
                }
            }
            await video.destroy();
            return { message: 'Video eliminado' }
        },
        
    
    }
};