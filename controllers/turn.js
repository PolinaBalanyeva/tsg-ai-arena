import Turn from '../models/Turn.js';

const getTurn = async (req, res) => {
	const _id = req.params.turn;

	const turn = await Turn.findOne({_id})
		.populate({
			path: 'battle',
			populate: [
				{path: 'contest'},
				{
					path: 'players',
					populate: {path: 'user'},
				},
			],
		})
		.exec();

	if (turn === null) {
		res.sendStatus(404);
		return;
	}

	if (turn.battle.contest.id !== req.params.contest) {
		res.redirect(`/contests/${turn.battle.contest.id}/turns/${turn._id}`);
		return;
	}

	res.render('turn', {
		contest: req.contest,
		turn,
	});
};

export default {getTurn,}
