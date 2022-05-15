import exp from 'constants';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const EventEmitter = require('events');
import PQueue from 'p-queue';

const getCodeLimit = (languageId) => {
	if (languageId === 'fernando') {
		return 1024 * 1024;
	}

	if (
		[
			'unlambda',
			'blc',
			'function2d',
			'brainfuck-bfi',
			'brainfuck-esotope',
			'taxi',
		].includes(languageId)
	) {
		return 100 * 1024;
	}

	return 10 * 1024;
};

const Deferred = class Deferred {
	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.nativeReject = reject;
			this.nativeResolve = resolve;
		});

		this.isResolved = false;
		this.isRejected = false;
	}

	resolve(...args) {
		this.nativeResolve(...args);
		this.isResolved = true;
	}

	reject(...args) {
		this.nativeReject(...args);
		this.isReject = true;
	}
};

const createLineDrainer = (stream) => {
	let buf = '';
	const lines = [];
	const lineEmitter = new EventEmitter();

	stream.on('data', (data) => {
		buf += data;

		while (buf.includes('\n')) {
			const line = buf.slice(0, buf.indexOf('\n') + 1);
			buf = buf.slice(buf.indexOf('\n') + 1);
			lines.push(line);
			lineEmitter.emit('line', line);
		}
	});

	const drain = () => new Promise((resolve) => {
		if (lines.length > 0) {
			resolve(lines.shift());
			return;
		}

		const lineCallback = () => {
			resolve(lines.shift());
			lineEmitter.removeListener('line', lineCallback);
		};

		lineEmitter.on('line', lineCallback);
	});

	return drain;
};

const queue = new PQueue({concurrency: 1});

const transaction = (func) => (
	queue.add(func)
);

export {
	getCodeLimit,
	Deferred,
	createLineDrainer,
	transaction
}
