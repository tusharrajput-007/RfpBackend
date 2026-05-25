const winston = require('winston')
const path = require('path')

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}] ${message}`
    })
)

const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        // console output
        new winston.transports.Console(),
        // all logs file
        new winston.transports.File({
            filename: path.join('logs', 'combined.log')
        }),
        // error logs file
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error'
        })
    ]
})

module.exports = logger