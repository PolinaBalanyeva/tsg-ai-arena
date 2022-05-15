// http://stackoverflow.com/a/28288406/2864502
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const io = require('socket.io')();

io.on('connection', (socket) => {
	console.log('Socket connected');

	socket.on('disconnect', () => {
		console.log('Socket disconnected');
	});
});

export default io
