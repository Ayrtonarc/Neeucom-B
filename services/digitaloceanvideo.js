// digitalocean.js

// Servicio de subida de video a DigitalOcean Spaces (S3 compatible)
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const bucketName = process.env.DO_SPACE_NAME;

function signRequest(method, key, contentType) {
  const date = new Date().toUTCString();
  const canonicalAmzHeaders = 'x-amz-acl:public-read\n';
  // El recurso debe ser /bucket/key para DigitalOcean Spaces
  const canonicalResource = `/${bucketName}/${key}`;
  const stringToSign = `${method}\n\n${contentType}\n${date}\n${canonicalAmzHeaders}${canonicalResource}`;
  const signature = crypto
    .createHmac('sha1', process.env.DO_SECRET_ACCESS_KEY)
    .update(stringToSign)
    .digest('base64');
  return { date, signature };
}

/**
 * Sube un archivo de video a DigitalOcean Spaces.
 * @param {string} key - Ruta y nombre del archivo (ej: userVideoFeed/1234.mp4)
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} contentType - Tipo MIME (ej: video/mp4)
 * @returns {Promise<string>} - URL pública del archivo subido
 */
async function uploadVideoToSpaces(key, fileBuffer, contentType) {
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  const { date, signature } = signRequest('PUT', cleanKey, contentType);
  const url = `https://${bucketName}.sfo2.digitaloceanspaces.com/${cleanKey}`;
  const headers = {
    'Content-Type': contentType,
    'Date': date,
    'Authorization': `AWS ${process.env.DO_ACCESS_KEY_ID}:${signature}`,
    'x-amz-acl': 'public-read',
  };
  const response = await axios.put(url, fileBuffer, { headers });
  if (response.status !== 200) {
    throw new Error(`Error al subir el archivo. Status: ${response.status}, Data: ${response.data}`);
  }
  return url;
}

/**
 * Elimina un archivo de video de DigitalOcean Spaces.
 * @param {string} key - Ruta y nombre del archivo (ej: userVideoFeed/1234.mp4)
 * @returns {Promise<void>}
 */
async function deleteVideoFromSpaces(key) {
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  // DELETE no requiere Content-Type ni x-amz-acl
  const date = new Date().toUTCString();
  const canonicalResource = `/${bucketName}/${cleanKey}`;
  const stringToSign = `DELETE\n\n\n${date}\n${canonicalResource}`;
  const signature = crypto
    .createHmac('sha1', process.env.DO_SECRET_ACCESS_KEY)
    .update(stringToSign)
    .digest('base64');
  const url = `https://${bucketName}.sfo2.digitaloceanspaces.com/${cleanKey}`;
  const headers = {
    'Date': date,
    'Authorization': `AWS ${process.env.DO_ACCESS_KEY_ID}:${signature}`,
  };
  const response = await axios.delete(url, { headers });
  if (response.status !== 204 && response.status !== 200) {
    throw new Error(`Error al eliminar el archivo. Status: ${response.status}, Data: ${response.data}`);
  }
}

module.exports = {
  uploadVideoToSpaces,
  deleteVideoFromSpaces,
};
