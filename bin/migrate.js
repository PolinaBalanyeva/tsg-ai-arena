const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const User = require('../models/User');
const Battle = require('../models/Battle');
const Match = require('../models/Match');
const Submission = require('../models/Submission');
const Turn = require('../models/Turn');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/test');

	await User.updateMany({}, {$set: {admin: false}});
	for (const id of ['hakatashi', 'azaika_', 'platypus999', 'hideo54', 'ishitatsuyuki', 'naan112358', 'noko_ut', 'polya_balanyeva']) {
		const user = await User.findOne({email: `${id}@twitter.com`});
		if (user) {
			user.admin = true;
			await user.save();
		}
	}

	for (const contestid of ['dragon-ball',	'mayfes2018-day1','mayfes2018-day2','mayfes2019-procon',
	'dragon-puzzles','komabasai2018-ai','komabasai2018-procon','mayfes2020-marathon','mayfes2021-marathon','mayfes2022-marathon']){
		const contest = await Contest.findOne({id: contestid});
		if (contest) {
			const battles = await Battle.find({contest});
			for (const battle of battles) {
				await Turn.deleteMany({battle});
			}
			await Battle.deleteMany({contest});
			await Match.deleteMany({contest});
			await Submission.deleteMany({contest});
			if (contestid != 'mayfes2022-marathon'){
				await Contest.deleteMany({id: contestid})
			}
			console.log(contest)
		}
	}

	await Contest.updateOne({id: 'mayfes2022-marathon'}, {
		name: 'TSG LIVE! 8 Live Programming Contest Marathon Match',
		id: 'mayfes2022-marathon',
		start: new Date('2022-05-15T12:33:00+0900'),
		end: new Date('2022-05-15T14:03:00+0900'),
		type: 'score',
		description: {
			ja: fs.readFileSync(path.resolve(__dirname, "../contests/mayfes2022-marathon.md")),
			en: '',
		},
	}, {upsert: true}, (err) => {
		if (err) {
			throw err;
		}
		console.log('inserting succeeded');
	});

	mongoose.connection.close();
})();