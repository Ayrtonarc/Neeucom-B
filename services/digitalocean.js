const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const spacesUrl = process.env.DO_ENDPOINT;  // Ej: "https://neeucomdos.sfo2.digitaloceanspaces.com"
const bucketName = process.env.DO_SPACE_NAME;

function getPublicUrl(key) {
  return `${spacesUrl}/${key}`;  // No se concatena el bucket manualmente aquí
}

function signRequest(method, path, contentType) {
  const date = new Date().toUTCString();
  // Se incluye el header x-amz-acl en el string a firmar
  const canonicalAmzHeaders = "x-amz-acl:public-read\n";
  const stringToSign = `${method}\n\n${contentType}\n${date}\n${canonicalAmzHeaders}/${bucketName}/${path}`;
  
  console.log('🛠️ String to sign:', stringToSign);

  const signature = crypto
    .createHmac('sha1', process.env.DO_SECRET_ACCESS_KEY)
    .update(stringToSign)
    .digest('base64');

  console.log(`📝 Firma generada: ${signature}`);
  return { date, signature };
}

async function uploadToSpaces(key, fileBuffer, contentType) {
  // Se limpia el key en caso de que tenga una barra inicial extra
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;

  const { date, signature } = signRequest('PUT', cleanKey, contentType);
  const url = `${spacesUrl}/${key}`;  // Asumiendo que antes funcionaba así
  console.log('🚀 Iniciando subida del archivo...');
  console.log(`🔑 Key del archivo: ${key}`);
  console.log('MIME type detectado:', contentType);
  
  const headers = {
    'Content-Type': contentType,
    'Date': date,
    'Authorization': `AWS ${process.env.DO_ACCESS_KEY_ID}:${signature}`,
    'x-amz-acl': 'public-read',  // Se mantiene este header para que el archivo sea público
  };

  try {
    const response = await axios.put(url, fileBuffer, { headers });

    if (response.status !== 200) {
      throw new Error(`Error al subir el archivo. Status: ${response.status}, Data: ${response.data}`);
    }

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


// Función para firmar la solicitud DELETE (no se incluye Content-Type ni headers x-amz, ya que no son necesarios)
function signRequestForDelete(method, path) {
  const date = new Date().toUTCString();
  // Para DELETE, la cadena a firmar sigue este formato:
  // DELETE\n (Content-MD5 vacío)\n (Content-Type vacío)\n {date}\n/{bucketName}/{path}
  const stringToSign = `${method}\n\n\n${date}\n/${bucketName}/${path}`;
  console.log('🛠️ String to sign (DELETE):', stringToSign);

  const signature = crypto
    .createHmac('sha1', process.env.DO_SECRET_ACCESS_KEY)
    .update(stringToSign)
    .digest('base64');

  console.log(`📝 Firma generada (DELETE): ${signature}`);
  return { date, signature };
}

// Función que envía una solicitud DELETE a DigitalOcean Spaces para eliminar un objeto
async function deleteFromSpaces(key) {
  // Asegurarse de que la key no tenga una barra inicial extra
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  const { date, signature } = signRequestForDelete('DELETE', cleanKey);
  // Se construye la URL para el DELETE
  const url = `${spacesUrl}/${cleanKey}`;
  const headers = {
    'Date': date,
    'Authorization': `AWS ${process.env.DO_ACCESS_KEY_ID}:${signature}`
  };

  try {
    const response = await axios.delete(url, { headers });
    // Los códigos 200 y 204 son respuestas correctas para DELETE
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Error al eliminar archivo. Status: ${response.status}`);
    }
    console.log(`✅ Archivo eliminado correctamente: ${cleanKey}`);
  } catch (error) {
    console.error(`❌ Error en deleteFromSpaces: ${error.response ? error.response.data : error.message}`);
    throw error;
  }
}

module.exports ={
  uploadToSpaces,
  deleteFromSpaces
};








