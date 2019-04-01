/**
 * Configurations of logger.
 */
const winston = require('winston');
const winstonRotator = require('winston-daily-rotate-file');
const path = require('path');

const consoleConfig = [
  new winston.transports.Console({
    'colorize': true
  }),
  new winstonRotator({
      'name': 'log-file',
      'level': 'info',
      'filename': `${path.resolve(__dirname, 'logs/log_file.log')}`,
      'json': false,
      'datePattern': 'YYYY-MM-DD',
      'prepend': true
    })
];

const logger = winston.createLogger({
  'transports': consoleConfig
});

module.exports = logger;