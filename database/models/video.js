'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Video extends Model {
    static associate(models) {
      // Cada video pertenece a un usuario
      Video.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  Video.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Genera automáticamente un UUID
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false, // Es recomendable requerir este campo para asegurar la relación
        references: {
          model: 'Users', // Debe coincidir con el nombre de la tabla de usuarios
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT, // Usamos TEXT para permitir descripciones largas
        allowNull: false,
      },
      videoUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      thumbnailUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Video',
      tableName: 'Videos', // Especificamos la tabla para mayor claridad
      timestamps: true, // Crea automáticamente los campos createdAt y updatedAt
    }
  );

  return Video;
};
