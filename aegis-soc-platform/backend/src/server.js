'use strict';

require('dotenv').config();

const app = require('./app');
const sequelize = require('./config/database');
const logger = require('./config/logger');
const { scheduleThreatIntelRefresh } = require('./services/threatIntelService');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    // In production, prefer migrations over sync(). sync() is convenient
    // for the SQLite zero-config small-business deployment path.
    await sequelize.sync();
    logger.info('Database models synchronized.');

    scheduleThreatIntelRefresh();

    app.listen(PORT, () => {
      logger.info(`Aegis SOC backend listening on port ${PORT} [env: ${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
});

start();
