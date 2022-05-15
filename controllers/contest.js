import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const MarkdownIt = require('markdown-it');
import Contest from '../models/Contest.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import contests from '../contests/index.js';





/*
 * Middleware for all /contest/:contest routes
 */
const base = async (req, res, next) => {

	const contest = await Contest.findOne({id: req.params.contest});
	

	if (!contest) {
		res.sendStatus(404);
		return;
	}

	req.contest = contest;
	req.contestData = contests[contest.id];
	next();
};

/*
 * GET /
 * Home page.
 */
const index = async (req, res) => {
	const markdown = new MarkdownIt({
		html: true
	});

	const presets = await Submission.find({
		contest: req.contest,
		isPreset: true,
	});

	res.render('contest', {
		title: '',
		contest: req.contest,
		description: {
			ja: markdown.render(req.contest.description.ja),
			en: markdown.render(req.contest.description.en),
		},
		presets,
		configs: req.contestData.configs,
	});
};

const postContest = async (req, res) => {
	if (!req.user.admin) {
		res.sendStatus(403);
		return;
	}

	req.contest.description.ja = req.body.description_ja || '';
	req.contest.description.en = req.body.description_en || '';
	await req.contest.save();

	res.redirect(`/contests/${req.contest.id}/admin`);
};

/*
 * GET /contest/:contest/admin
 */
const getAdmin = async (req, res) => {
	if (!req.user.admin) {
		res.sendStatus(403);
		return;
	}

	const users = await User.find();

	res.render('admin', {
		contest: req.contest,
		users,
	});
};

export default {
	getAdmin,
	postContest,
	index,
	base
}
