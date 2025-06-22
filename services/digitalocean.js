const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const spacesUrl = process.env.DO_ENDPOINT;  // Ej: "https://neeucomdos.sfo2.digitaloceanspaces.com"
const bucketName = process.env.DO_SPACE_NAME;

function getPublicUrl(key) {
  return `${spacesUrl}/${key}`;  // No se concatena el bucket manualmente aquí
}

function signRequest(method, key, contentType) {
  const date = new Date().toUTCString();
  const canonicalAmzHeaders = "x-amz-acl:public-read\n";
  // El recurso debe ser /bucket/key para DigitalOcean Spaces
  const canonicalResource = `/${bucketName}/${key}`;
  const stringToSign = `${method}\n\n${contentType}\n${date}\n${canonicalAmzHeaders}${canonicalResource}`;
  console.log('🛠️ String to sign:', stringToSign);

  const signature = crypto
    .createHmac('sha1', process.env.DO_SECRET_ACCESS_KEY)
    .update(stringToSign)
    .digest('base64');

  console.log(`📝 Firma generada: ${signature}`);
  return { date, signature };
}

/**
 * Sube una foto de perfil a DigitalOcean Spaces.
 * @param {string} key - Ruta y nombre del archivo (ej: userProfilePictures/user_123/avatar.png)
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} contentType - Tipo MIME (ej: image/png)
 * @returns {Promise<string>} - URL pública del archivo subido
 */
async function uploadProfilePictureToSpaces(key, fileBuffer, contentType) {
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
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Error al subir la foto de perfil. Status: ${response.status}, Data: ${response.data}`);
  }
  return url;
}

/**
 * Elimina una foto de perfil de DigitalOcean Spaces.
 * @param {string} key - Ruta y nombre del archivo (ej: userProfilePictures/user_123/avatar.png)
 * @returns {Promise<void>}
 */
async function deleteProfilePictureFromSpaces(key) {
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
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
  // LOGS para depuración
  console.log('Intentando borrar en Spaces:');
  console.log('  URL:', url);
  console.log('  Key:', cleanKey);
  console.log('  Headers:', headers);
  console.log('  StringToSign:', stringToSign);
  try {
    const response = await axios.delete(url, { headers });
    console.log('  Respuesta status:', response.status);
    if (response.status !== 204 && response.status !== 200) {
      throw new Error(`Error al eliminar la foto de perfil. Status: ${response.status}, Data: ${response.data}`);
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log('  Archivo no existe en Spaces (404).');
      return;
    }
    console.error('  Error al borrar en Spaces:', err.response?.data || err.message || err);
    throw err;
  }
}

module.exports = {
  uploadProfilePictureToSpaces,
  deleteProfilePictureFromSpaces,
};








