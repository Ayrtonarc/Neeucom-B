// database/models/user.js


const bcrypt = require('bcryptjs');
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Follow, { foreignKey: 'user', as: 'follow' });
      User.hasMany(models.Follow, { foreignKey: 'followed', as: 'followed' });
    }

    async generatePasswordHash() {
      if (this.password) {
        return bcrypt.hash(this.password, 10);
      }
    }
  }

  User.init({
    firstname: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "firstname",
      defaultValue: ''
    },
    lastname: DataTypes.STRING,
    username: DataTypes.STRING,
    bio: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'User',
    defaultScope: {
      rawAttributes: { exclude: ['password'] },
    },
  });

  User.beforeCreate(async (user) => {
    user.password = await user.generatePasswordHash();
  });

  return User;
};