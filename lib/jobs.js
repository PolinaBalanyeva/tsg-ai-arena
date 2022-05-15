import runner from '../lib/runner.js';

const dequeueBattles = async (job, done) => {
	await runner.dequeue();
	done();
};

export default dequeueBattles
