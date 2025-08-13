'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Likes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false,
        unique: true,
        field: 'id',
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      videoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Videos',
          key: 'id'
        }
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
    
    await queryInterface.addConstraint('Likes', {
      fields: ['userId', 'videoId'],
      type: 'unique',
      name: 'unique_user_video_like'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Likes');
  }
};
