/* eslint array-plural/array-plural: off */
// 
const {stripIndent} = require('common-tags');
const noop = require('lodash/noop');
const sumBy = require('lodash/sumBy');
const isEqual = require('lodash/isEqual');
const bigRat = require('big-rational');
const { isInteger } = require('lodash');
const { match } = require('sinon');

module.exports.presets = {};

const BOARD_WIDTH = 4000;
module.exports.BOARD_WIDTH = BOARD_WIDTH;
const BOARD_HEIGHT = 4000;
module.exports.BOARD_HEIGHT = BOARD_HEIGHT;
const generateBoard = (length, minCost, maxCost) => {
	const getRandomInt = (min, max) => {
		return Math.round(
			Math.random() * (max - min + 0.9) + min - 0.45
		);
	};

	const usedCoords = new Set();
	const newCoord = () => {
		const ret = {};
		do {
			ret.x = getRandomInt(-BOARD_WIDTH/2, BOARD_WIDTH/2);
			ret.y = getRandomInt(-BOARD_HEIGHT/2, BOARD_HEIGHT/2);
		} while (usedCoords.has(ret));
		usedCoords.add(ret);
		return ret;
	};

	return Array(length).fill(0).map((index) => {
		const coord = newCoord();
		const cost = getRandomInt(minCost, maxCost);
		return {
			x: coord.x,
			y: coord.y,
			cost
		};
	});
};

const parseInput = (stdin) => {
	const lines = stdin.toString().split('\n');
	lines.shift();
	lines.pop();
	return lines.map(str => {
		const tower = str.split(' ').map(x => parseInt(x));
		return {
			x : tower[0],
			y : tower[1],
			cost : BigInt(tower[2]),
			activated : false,
			pressed : BigInt(0),
			antenna : 0
		};
	});
};

module.exports.parseInput = parseInput;

const parseOutput = (stdout, numTower) => {
	const lines = stdout.toString().split('\n');
	const numOperation = parseInt(lines.shift());
	if (lines[lines.length - 1] == "")
		lines.pop();
	
	if (!isInteger(numOperation) || numOperation < 0 || 200000 < numOperation)
		throw new Error('Invalid Answer: M is invalid or null(' + numOperation + ')');
	
	const operations = lines.map(line => {
		const arr = line.split(' ');
		if (arr.length != 2)
			throw new Error('Invalid Answer: presentation error');
		const op = arr.map(x => parseInt(x)).filter(x => isInteger(x));
		if (op.length != 2)
			throw new Error('Invalid Answer: parse error');
		if (op[0] <= 0 || numTower < op[0] || op[1] <= 0 || 1000000000000 < op[1])
			throw new Error('Invalid Answer: invalid operation(' + arr + ')');
		
		return {
			id : op[0],
			t : BigInt(op[1])
		};
	});
	if (operations.length != numOperation)
		throw new Error('Invalid Answer: too many or few output');

	return operations;
};

module.exports.parseOutput = parseOutput;

const normSq = (tw1, tw2) => {
	const dx = BigInt(tw2.x - tw1.x);
	const dy = BigInt(tw2.y - tw1.y);
	return dx * dx + dy * dy;
};

module.exports.normSq = normSq;

const WORST_SCORE = 32 * (10 ** 9);
module.exports.WORST_SCORE = WORST_SCORE;

const operate = (towers, op, time) => {
	const tower = towers[op.id - 1];
	if (!tower.activated)
		return {
			activatedList : [],
			time : BigInt(0)
		};
	
	tower.pressed += op.t;
	tower.antenna = Number(tower.pressed * BigInt(100) / tower.cost) / 100;
	time += op.t;

	const activatedList = [];
	for (let i = 0; i < towers.length; i++) {
		const tw = towers[i];
		if (normSq(tower, tw) * tower.cost <= tower.pressed) {
			if (!tw.activated)
				activatedList.push(i);
			
			towers[i].activated = true;
		}
	}

	return {
		activatedList,
		time
	};
};

module.exports.operate = operate;

const calcScore = (towers, operations) => {
	let total = BigInt(0);
	operations.forEach(op => {
		const {time} = operate(towers, op, total);
		total = time;
	});

	if (towers.reduce((acc, tw) => { return acc && tw.activated; }, true))
		return (total >= WORST_SCORE ? WORST_SCORE : Number(total));
	else
		return WORST_SCORE;
};

module.exports.calcScore = calcScore;

const getUsedNum = (stdout) => {
	const usedNum = stdout.toString().trim().split('\n')[0].replace(/[+\-*/ ()]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map((token) => parseInt(token)).sort();
	return usedNum;
};

module.exports.getUsedNum = getUsedNum;

const normalize = (stdout) => {
	const infixFormula = stdout.toString().trim().replace(/\s*([+\-*/()])\s*/g, '$1').replace(/ +/g, '^').replace(/[+\-*/^()]/g, ' $& ').replace(/\s+/g, ' ').trim().split(' ');
	return infixFormula;
};

module.exports.normalize = normalize;

const serialize = ({state, params}) => `${params.length}\n` +
	state.sequence.map((tower) => tower.x.toString() + ' ' + tower.y.toString() + ' ' + tower.cost.toString()).join('\n') + '\n';

module.exports.serialize = serialize;

const SMALL_STATIC_INPUT = "20\n-1695 514 334\n-201 974 555\n-1669 -554 666\n-1042 -1750 773\n162 248 889\n-446 1066 515\n-820 -1160 167\n1974 298 523\n-1173 -319 32\n-984 1720 742\n560 -1862 606\n-1074 1733 268\n-214 176 195\n432 1743 468\n1515 -543 262\n-1074 1918 108\n1169 171 896\n-1335 -961 488\n-1888 590 294\n1606 169 409\n";

module.exports.battler = async (
	execute,
	params,
	{onFrame = noop, initState} = {},
) => {
	const initialState = initState || {
		score: 0,
		sequence: (params.mode == 'small-static' ? {} : generateBoard(params.length, params.minCost, params.maxCost)),
	};
	const stdin = (params.mode == 'small-static' ? SMALL_STATIC_INPUT : serialize({params, state: initialState}));
	const towers = parseInput(stdin);
	towers[0].activated = true;
	
	try {
		const {stdout} = await execute(stdin, 0);
		const operations = parseOutput(stdout);

		return {
			result: 'settled',
			winner: 0,
			scores: [calcScore(towers, operations)],
		};
	}
	catch (e) {
		console.log('error! : length = ' + params.length.toString());
		console.log(e);
		if (params.length <= 20) {
			console.log(initialState.sequence);
		}
		return {
			result: 'settled',
			winner: 0,
			scores: [WORST_SCORE],
		};
	}
};

module.exports.configs = [
	{
		default: true,
		id: 'small-static',
		name: '20 small-static',
		params: {
			mode: 'small-static',
			length: 20,
			minCost: 1,
			maxCost: 1000
		},
	},
	{
		id: 'small',
		name: '20 small',
		params: {
			mode: 'random',
			length: 20,
			minCost: 1,
			maxCost: 1000
		},
	},
	{
		id: 'mid-a',
		name: '200 medium-a',
		params: {
			mode: 'random',
			length: 200,
			minCost: 1,
			maxCost: 1000
		},
	},
	{
		id: 'mid-b',
		name: '200 medium-b',
		params: {
			mode: 'random',
			length: 200,
			minCost: 490,
			maxCost: 510
		},
	},
	{
		id: 'large-a',
		name: '2000 large-a',
		params: {
			mode: 'random',
			length: 2000,
			minCost: 1,
			maxCost: 1000
		},
	},
	{
		id: 'large-b',
		name: '2000 large-b',
		params: {
			mode: 'random',
			length: 2000,
			minCost: 490,
			maxCost: 510
		},
	},
];

const matchConfigs = [
	...Array(1)
		.fill()
		.map(() => ({
			config: 'small-static',
			players: [0],
		})),
	...Array(2)
		.fill()
		.map(() => ({
			config: 'small',
			players: [0],
		})),
	...Array(4)
		.fill()
		.map(() => ({
			config: 'mid-a',
			players: [0],
		})),
	...Array(4)
		.fill()
		.map(() => ({
			config: 'mid-b',
			players: [0],
		})),
	...Array(3)
		.fill()
		.map(() => ({
			config: 'large-a',
			players: [0],
		})),
	...Array(3)
		.fill()
		.map(() => ({
			config: 'large-b',
			players: [0],
		})),
];
module.exports.matchConfigs = matchConfigs;

module.exports.judgeMatch = (results) => ({
	result: results[0].result,
	winner: results[0].winner,
	scores: [sumBy(
		results,
		({scores}) => (scores[0] >= WORST_SCORE ? 0 : Math.round(10000 * (1 - Math.pow(scores[0]/WORST_SCORE, 0.25))))
	)],
});
