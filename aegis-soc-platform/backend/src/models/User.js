'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {
  toSafeJSON() {
    const { passwordHash, ...safe } = this.toJSON();
    return safe;
  }
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('admin', 'soc_manager', 'analyst_tier1', 'analyst_tier2', 'auditor'),
      allowNull: false,
      defaultValue: 'analyst_tier1',
    },
    phoneNumber: { type: DataTypes.STRING, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    mfaEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  }
);

module.exports = User;
