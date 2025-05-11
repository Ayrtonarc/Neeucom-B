// digitalocean.js

const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

// Endpoint de estilo virtual-host, e.g. "https://neeucomdos.sfo2.digitaloceanspaces.com"
const spacesUrl = process.env.DO_ENDPOINT;

/**
 * Retorna la URL pública de un archivo en Spaces a partir de la key.
 */
function getPublicUrl(key) {
  return `${spacesUrl}/${key}`;
}

/**
 * Firma la solicitud PUT con la ruta canónica adecuada (SIN concatenar el bucket).
 * Se incluye el header x-amz-acl:public-read en la firma.
 */
function signRequest(method, path, contentType) {
  const date = new Date().toUTCString();
  const canonicalAmzHeaders = 'x-amz-acl:public-read\n';
  // En endpoint virtual-host, la ruta canónica es /{path}, sin {bucketName}.
  const stringToSign = `${method}\n\n${contentType}\n${date}\n${canonicalAmzHeaders}/${path}`;

  console.log('🛠️ String to sign (PUT):', stringToSign);

  const signature = crypto
    .createHmac('sha1', process.env.DO_SECRET_ACCESS_KEY)
    .update(stringToSign)
    .digest('base64');

  console.log(`📝 Firma generada (PUT): ${signature}`);
  return { date, signature };
}

/**
 * Sube un archivo (por ejemplo, un video) a DigitalOcean Spaces.
 * @param {string} key - La clave única donde se almacenará el archivo (e.g. "userVideos/user_123/video_123.mp4")
 * @param {Buffer} fileBuffer - El contenido del archivo en un Buffer
 * @param {string} contentType - El tipo MIME (e.g. "video/mp4")
 */
async function uploadVideoToSpaces(key, fileBuffer, contentType) {
  // Asegura que la key no comience con "/"
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  const { date, signature } = signRequest('PUT', cleanKey, contentType);

  const url = `${spacesUrl}/${key}`;
  console.log('🚀 Iniciando subida del archivo...');
  console.log(`🔑 Key del archivo: ${key}`);
  console.log('MIME type detectado:', contentType);

  const headers = {
    'Content-Type': contentType,
    'Date': date,
    'Authorization': `AWS ${process.env.DO_ACCESS_KEY_ID}:${signature}`,
    'x-amz-acl': 'public-read', // Permite acceso público al archivo
  };

  try {
    const response = await axios.put(url, fileBuffer, { headers });
    if (response.status !== 200) {
      throw new Error(`Error al subir el archivo. Status: ${response.status}, Data: ${response.data}`);
    }
    // Retorna la URL pública del archivo
    return getPublicUrl(key);
  } catch (error) {
    if (error.response) {
      console.error(`❌ Error en la respuesta de Spaces: ${error.response.status} - ${error.response.data}`);
    } else {
      console.error(`❌ Error general: ${error.message}`);
    }
    throw new Error('Error al subir el archivo a DigitalOcean Spaces');
  }
}

/**
 * Firma la solicitud DELETE. Para DELETE no se incluye Content-Type ni x-amz-acl en la firma,
 * y NO se concatena el bucketName en la ruta canónica si el endpoint es estilo virtual-host.
 */
function signRequestForDelete(method, path) {
  const date = new Date().toUTCString();
  // Formato: DELETE\n\n\n{date}\n/{path}
  const stringToSign = `${method}\n\n\n${date}\n/${path}`;
  console.log('🛠️ String to sign (DELETE):', stringToSign);

  const signature = crypto
    .createHmac('sha1', process.env.DO_SECRET_ACCESS_KEY)
    .update(stringToSign)
    .digest('base64');

  console.log(`📝 Firma generada (DELETE): ${signature}`);
  return { date, signature };
}

/**
 * Elimina un archivo (por ejemplo, un video) de DigitalOcean Spaces.
 * @param {string} key - La clave única donde se almacenó el archivo
 */
async function deleteVideoFromSpaces(key) {
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  const { date, signature } = signRequestForDelete('DELETE', cleanKey);

  const url = `${spacesUrl}/${cleanKey}`;
  const headers = {
    'Date': date,
    'Authorization': `AWS ${process.env.DO_ACCESS_KEY_ID}:${signature}`,
  };

  try {
    const response = await axios.delete(url, { headers });
    // Respuestas 200 o 204 indican borrado exitoso
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Error al eliminar archivo. Status: ${response.status}`);
    }
    console.log(`✅ Archivo eliminado correctamente: ${cleanKey}`);
  } catch (error) {
    if (error.response) {
      console.error(`❌ Error en deleteVideoFromSpaces: ${error.response.status} - ${error.response.data}`);
    } else {
      console.error(`❌ Error general en deleteVideoFromSpaces: ${error.message}`);
    }
    throw error;
  }
}

module.exports = {
  uploadVideoToSpaces,
  deleteVideoFromSpaces,
};
