'use strict';

const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const logger = require('./logger');

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'sqlite') {
  const storagePath = process.env.DB_STORAGE || './data/aegis-soc.sqlite';
  const resolvedPath = path.resolve(__dirname, '../../', storagePath);
  const dataDir = path.dirname(resolvedPath);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: resolvedPath,
    logging: (msg) => logger.debug(msg),
  });
} else {
  // Production-scale deployments (PostgreSQL / MySQL)
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect,
      logging: (msg) => logger.debug(msg),
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    }
  );
}

module.exports = sequelize;
