// database/config/config.js

require('dotenv').config();

module.exports = {
  development: {
    username: 'postgres',
    password: 'admin',
    database: 'newcomdb',
    host: '127.0.0.1',
    dialect: 'postgres',
    url: process.env.DATABASE_URL
  },
  test: {
    username: 'root',
    password: null,
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'postgres',
    host: '127.0.0.1',
    dialect: 'postgres',
    url: process.env.DATABASE_URL,
  },
  production: {
    username: 'root',
    password: null,
    database: 'database_production',
    host: '127.0.0.1',
    dialect: 'postgres',
    host: '127.0.0.1',
    dialect: 'postgres',
    url: process.env.DATABASE_URL,
  },
};

