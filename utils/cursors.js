/**
 * @name toCursorHash
 * @description Use this function to transform an UUID string to base64.
 * @param {String} uuidStr
 * @return {String} base64
 */
function toCursorHash(uuidStr) {
    if (!uuidStr) return '';
    return Buffer.from(uuidStr).toString('base64');
  }
  
  /**
   * @name fromCursorHash
   * @description Use this function to transform a base64 string to ascii.
   * @param {String} base64Str
   * @return {String} ascii
   */
  function fromCursorHash(base64Str) {
    if (!base64Str) return '';
    return Buffer.from(JSON.stringify(base64Str), 'base64').toString('ascii');
  }
  
  module.exports = {
    fromCursorHash,
    toCursorHash
  }