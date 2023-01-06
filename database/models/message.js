'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Message.init({
    text: DataTypes.STRING,
    from: DataTypes.STRING,
    to: DataTypes.STRING,
    viewed: DataTypes.STRING,
    createdAt: {
      type: "TIMESTAMP",
      allowNull: false,
      field: "createdAt",
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages'
  });
  return Message;
};