'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Follow extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Follow.belongsTo(models.User, {foreignKey: 'userId', as: 'followers'});
      Follow.belongsTo(models.User, {foreignKey: 'followedId', as: 'following'});  //linea nueva
      
      
    }
  }
  Follow.init({

    userId: DataTypes.UUID,

    followedId: DataTypes.UUID,
    

    createdAt: {
      type: "TIMESTAMP",
      allowNull: false,
      field: "createdAt",
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: "TIMESTAMP",
      allowNull: false,
      field: "updatedAt",
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    }


  }, {
    sequelize,
    modelName: 'Follow',
    tableName: 'Follows'
  });
  return Follow;
};