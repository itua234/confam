// logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'kyc-saas-auth' },
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        // new winston.transports.File({
        //     filename: 'error.log',
        //     level: 'error',
        //     dirname: './logs',
        //     maxsize: 1024 * 1024 * 5, // 5MB
        //     maxFiles: 5,
        //     tailable: true,
        //     zippedArchive: true,
        // }),
        // new winston.transports.File({
        //     filename: 'combined.log',
        //     dirname: './logs',
        //     maxsize: 1024 * 1024 * 10, // 10MB
        //     maxFiles: 10,
        //     tailable: true,
        //     zippedArchive: true,
        // }),
    ],
});

module.exports = logger;