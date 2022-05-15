/* eslint array-plural/array-plural: off */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const noop = require('lodash/noop');
const chunk = require('lodash/chunk');
const sumBy = require('lodash/sumBy');

const presets = {};

const initMaps = (height, width) => {
	const field = Array(width * height).fill(0).map((index) => ({
		num: Math.floor(Math.random() * 201) - 100,
		visited: index === 0,
	}));
	return field;
};


const normalize = (stdout) => {
	const lines = stdout.toString().trim().split('\n')[0].split('');
	const dx = [0, 1, 0, -1];
	const dy = [1, 0, -1, 0];
	const dir = 'SENW'.split('');
	const moves = lines.map((c) => {
		let move = {dx: 0, dy: 0};
		dir.forEach((direction, i) => {
			if (c === direction) {
				move = {
					dx: dx[i],
					dy: dy[i],
				};
			}
		});
		return move;
	});
	return moves;
};


const deserialize = (stdin) => {
	const lines = stdin.split('\n').filter((line) => line.length > 0);
	const [width, height] = lines[0].split(' ').map((token) => parseInt(token));
	const field = [];
	lines.slice(1).forEach((l, y) => {
		const cells = l.split(' ');
		cells.forEach((cell, x) => {
			field.push({
				num: parseInt(cell),
				visited: x === 0 && y === 0,
			});
		});
	});

	return {
		state: {
			x: 0,
			y: 0,
			field,
			score: field[0].num,
		},
		params: {
			width,
			height,
		},
	};
};


const serialize = ({state, params}) => `${[
	`${params.height} ${params.width}`,
	...chunk(state.field, params.width).map((line) => line.map((cell) => cell.num.toString()).join(' ')),
].join('\n')}\n`;


const isInside = (x, y, w, h) => x >= 0 && x < w && y >= 0 && y < h;


const battler = async (
	execute,
	params,
	{onFrame = noop, initState} = {}
) => {
	const field = initMaps(params.height, params.width);
	const initialState = initState || {
		x: 0,
		y: 0,
		score: field[0].num,
		field,
	};
	const {state} = deserialize(serialize({params, state: initialState}));
	const {stdout} = await execute(serialize({params, state: initialState}), 0);
	const moves = normalize(stdout, params);
	moves.forEach((move, idx) => {
		// move
		if (state.score !== 1e9) {
			state.x += move.dx;
			state.y += move.dy;
			if (!isInside(state.x, state.y, params.width, params.height)) {
				state.score = 1e9;
			} else if (state.field[state.y * params.width + state.x].visited) {
				state.score = 1e9;
			} else {
				state.field[state.y * params.width + state.x].visited = true;
				state.score += state.field[state.y * params.width + state.x].num;
			}
			onFrame({state});
		}
	});
	if (state.y !== params.height - 1 || state.x !== params.width - 1) {
		state.score = 1e9;
	}
	return {
		result: 'settled',
		winner: 0,
		scores: [Math.abs(state.score)],
	};
};

const configs = [
	{
		default: true,
		id: 'tiny',
		name: '3 x 3 tiny',
		params: {
			mode: 'one-path',
			height: 3,
			width: 3,
		},
	},
	{
		id: 'small',
		name: '5 x 5 small',
		params: {
			mode: 'random',
			height: 5,
			width: 5,
		},
	},
	{
		id: 'middle',
		name: '10 x 10 middle',
		params: {
			mode: 'random',
			height: 10,
			width: 10,
		},
	},
	{
		id: 'large',
		name: '30 x 30 large',
		params: {
			mode: 'random',
			height: 30,
			width: 30,
		},
	},
];


const matchConfigs = [
	...Array(3)
		.fill()
		.map(() => ({
			config: 'tiny',
			players: [0],
		})),
	...Array(3)
		.fill()
		.map(() => ({
			config: 'small',
			players: [0],
		})),
	...Array(1)
		.fill()
		.map(() => ({
			config: 'middle',
			players: [0],
		})),
	...Array(1)
		.fill()
		.map(() => ({
			config: 'large',
			players: [0],
		})),
];

const judgeMatch = (results) => ({
	result: results[0].result,
	winner: results[0].winner,
	scores: [sumBy(results, ({scores}) => scores[0])],
});

export default {
	initMaps,
	normalize,
	deserialize,
	serialize,
	isInside,
	presets,
	battler,
	configs,
	matchConfigs,
	judgeMatch
}
