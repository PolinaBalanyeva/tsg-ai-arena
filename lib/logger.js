import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const winston = require('winston');

const logger = winston.createLogger({
	level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
	transports: [
		new winston.transports.Console({
			format: winston.format.simple(),
		}),
	],
});

export default logger