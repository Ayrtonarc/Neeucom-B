// const axios = require('axios');
// const crypto = require('crypto');
// require('dotenv').config();

// const spacesUrl = process.env.DO_ENDPOINT;
// const bucketName = process.env.DO_SPACE_NAME;

// function getPublicUrl(key) {
//   return `${spacesUrl}/${key}`;  // No concatenes el bucket manualmente
// }

// function signRequest(method, path, contentType) {
//   const date = new Date().toUTCString();
  
//   // El string de firma debe incluir el bucket
//   const stringToSign = `${method}\n\n${contentType}\n${date}\n/${bucketName}/${path}`;
  
//   console.log('🛠️ String to sign:', stringToSign);

//   const signature = crypto
//     .createHmac('sha1', process.env.DO_SECRET_ACCESS_KEY)
//     .update(stringToSign)
//     .digest('base64');

//   console.log(`📝 Firma generada: ${signature}`);
//   return { date, signature };
// }

// async function uploadToSpaces(key, fileBuffer, contentType) {
//   const { date, signature } = signRequest('PUT', key, contentType);

//   const url = `${spacesUrl}/${key}`;  // No concatenar el bucket aquí

//   const headers = {
//     'Content-Type': contentType,
//     'Date': date,
//     'Authorization': `AWS ${process.env.DO_ACCESS_KEY_ID}:${signature}`,
//     // 'x-amz-acl': 'public-read',  // Permiso para acceso público
//   };

//   console.log('🚀 Iniciando subida del archivo...');
//   console.log(`🔑 Key del archivo: ${key}`);
//   console.log('🛠️ Headers:', headers);

//   try {
//     const response = await axios.put(url, fileBuffer, { headers });

//     if (response.status !== 200) {
//       throw new Error(`Error al subir el archivo. Status: ${response.status}, Data: ${response.data}`);
//     }

//     return getPublicUrl(key);
//   } catch (error) {
//     if (error.response) {
//       console.error(`❌ Error en la respuesta de Spaces: ${error.response.status} - ${error.response.data}`);
//     } else {
//       console.error(`❌ Error general: ${error.message}`);
//     }
//     throw new Error('Error al subir el archivo a DigitalOcean Spaces');
//   }
// }

// module.exports = uploadToSpaces;

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

module.exports = uploadToSpaces;








