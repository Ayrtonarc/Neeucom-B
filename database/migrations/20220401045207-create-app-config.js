'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const queryString = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
    await queryInterface.sequelize.query(queryString,{raw: true});
    await queryInterface.createTable('AppConfigs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      appVersion: {
        type: Sequelize.STRING
      },
      appVersionAndroid: {
        type: Sequelize.STRING
      },
      linkIos: {
        type: Sequelize.STRING
      },
      linkAndroid: {
        type: Sequelize.STRING
      },
      backendVersion: {
        type: Sequelize.STRING
      },
      buildVersion: {
        type: Sequelize.STRING
      },
      buildVersionAndroid: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AppConfigs');
  }
};