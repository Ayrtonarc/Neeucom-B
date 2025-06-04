// digitalocean.js

const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const spacesUrl = process.env.DO_ENDPOINT; // Ejemplo: https://<bucket>.<region>.digitaloceanspaces.com

function getPublicUrl(key) {
  return `${spacesUrl}/${encodeURIComponent(key)}`;
}

/**
 * Firma la solicitud PUT para Spaces (S3 compatible).
 * La ruta canónica debe empezar con '/' y NO debe estar codificada.
 */
function signRequest(method, key, contentType) {
  const date = new Date().toUTCString();
  const canonicalAmzHeaders = 'x-amz-acl:public-read\n';
  const canonicalResource = `/${key}`; // No codificado, sin bucket si usas endpoint virtual-host

  const stringToSign =
    `${method}\n` +
    `\n` + // Content-MD5 vacío
    `${contentType}\n` +
    `${date}\n` +
    `${canonicalAmzHeaders}` +
    `${canonicalResource}`;

  console.log('🛠️ String to sign (PUT):', stringToSign);

  const signature = crypto
    .createHmac('sha1', process.env.DO_SECRET_ACCESS_KEY)
    .update(stringToSign)
    .digest('base64');

  console.log(`📝 Firma generada (PUT): ${signature}`);
  return { date, signature };
}

/**
 * Sube un archivo de video a DigitalOcean Spaces.
 * @param {string} key - Nombre del archivo (ej: "1747005998157.mp4")
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} contentType - Tipo MIME (ej: "video/mp4")
 */
async function uploadVideoToSpaces(key, fileBuffer, contentType) {
  // NO codifiques el key para la firma
  const { date, signature } = signRequest('PUT', key, contentType);

  // Codifica el key SOLO para la URL
  const url = `${spacesUrl}/${encodeURIComponent(key)}`;
  console.log('🚀 Iniciando subida del archivo...');
  console.log(`🔑 Key del archivo: ${key}`);
  console.log('MIME type detectado:', contentType);

  // Comparar hora local y hora del servidor Spaces
  const localDate = new Date();
  console.log('🕒 Hora local (equipo):', localDate.toUTCString());
  console.log('🕒 Hora enviada en header Date:', date);

  // Obtener hora del servidor Spaces
  try {
    const headResp = await axios.head(spacesUrl);
    const serverDate = headResp.headers.date;
    console.log('🕒 Hora del servidor Spaces:', serverDate);
    const diff = Math.abs(new Date(serverDate).getTime() - localDate.getTime()) / 1000;
    console.log(`🕒 Diferencia entre hora local y servidor: ${diff} segundos`);
  } catch (e) {
    console.warn('No se pudo obtener la hora del servidor Spaces:', e.message);
  }

  const headers = {
    'Content-Type': contentType,
    'Date': date,
    'Authorization': `AWS ${process.env.DO_ACCESS_KEY_ID}:${signature}`,
    'x-amz-acl': 'public-read',
  };

  // Log para verificar permisos y credenciales
  console.log('🔒 Verificando permisos y credenciales:');
  console.log('DO_ACCESS_KEY_ID:', process.env.DO_ACCESS_KEY_ID);
  console.log('DO_SECRET_ACCESS_KEY:', process.env.DO_SECRET_ACCESS_KEY ? '***HIDDEN***' : 'NOT SET');
  console.log('DO_ENDPOINT:', process.env.DO_ENDPOINT);
  console.log('Headers enviados:', headers);

  try {
    const response = await axios.put(url, fileBuffer, { headers });
    if (response.status !== 200) {
      throw new Error(`Error al subir el archivo. Status: ${response.status}, Data: ${response.data}`);
    }
    return getPublicUrl(key);
  } catch (error) {
    if (error.response) {
      console.error(`❌ Error en la respuesta de Spaces: ${error.response.status} - ${error.response.data}`);
      if (error.response.status === 403) {
        console.error('❌ 403 Forbidden: Verifica que las credenciales y permisos sean correctos para el bucket.');
      }
    } else {
      console.error(`❌ Error general: ${error.message}`);
    }
    throw new Error('Error al subir el archivo a DigitalOcean Spaces');
  }
}

module.exports = {
  uploadVideoToSpaces,
};
