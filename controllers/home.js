import { nextTick } from 'process';
import Contest from '../models/Contest.js';

/*
 * GET /
 * Home page.
 */
const index = async (req, res) => {
	const contests = await Contest.find()
		.sort({_id: -1})
		.exec();

	res.render('home', {
		title: 'Home',
		contests,
	});
};
export default {index,}