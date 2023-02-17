const { gql } = require("apollo-server-express");

module.exports = gql `
input MediaImage {
    image: Upload
    text: String
    url: String
  }

  input MediaVideo {
    video: Upload
  }
`

