// database/models/user.js


const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
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
    },
    {
      defaultScope: {
        rawAttributes: { exclude: ['password'] },
      },
    },
  );

  User.beforeCreate(async (user) => {
    user.password = await user.generatePasswordHash();
  });
  User.prototype.generatePasswordHash = function () {
    if (this.password) {
      return bcrypt.hash(this.password, 10);
    }
  };
  User.associate = function (models) {
    // associations can be defined here
  };
  return User;
};