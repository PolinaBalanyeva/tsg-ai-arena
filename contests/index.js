const testJS = import('./test.js');
const dragonBall = import('./dragon-ball.js');
const mayfes2018Day1 = import('./mayfes2018-day1.js');
const mayfes2018Day2 = import('./mayfes2018-day2.js');
const mayfes2019Procon = import('./mayfes2019-procon.js');
const dragonPuzzles = import('./dragon-puzzles.js');
const komabasai2018Ai = import('./komabasai2018-ai.js');
const komabasai2018Procon = import('./komabasai2018-procon.js');
const mayfes2020Marathon = import('./mayfes2020-marathon.js');
const mayfes2021Marathon = import('./mayfes2021-marathon.js');
const mayfes2022Marathon = import('./mayfes2022-marathon.js');

const contestsIndex = {
	'test': testJS,
	'dragon-ball': dragonBall,
	'mayfes2018-day1': mayfes2018Day1,
	'mayfes2018-day2': mayfes2018Day2,
  'mayfes2019-procon': mayfes2019Procon,
	'dragon-puzzles': dragonPuzzles,
	'komabasai2018-ai': komabasai2018Ai,
	'komabasai2018-procon': komabasai2018Procon,
	'mayfes2020-marathon' : mayfes2020Marathon,
	'mayfes2021-marathon' : mayfes2021Marathon,
	'mayfes2022-marathon' : mayfes2022Marathon,
};
const substitution = async (contestsIndex,id) => {
	const {default: contestsOne} = await contestsIndex[id]
	return contestsOne
}
const contests = new Array();
(async function(){
	for (const id of Object.keys(contestsIndex)){
		contests[String(id)] = await substitution(contestsIndex,id)
	}
}())
export default contests
