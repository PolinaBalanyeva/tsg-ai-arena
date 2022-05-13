/* eslint array-plural/array-plural: off, no-nested-ternary: off */

const seedrandom = require('seedrandom');
const assert = require('assert');
const range = require('lodash/range');
const noop = require('lodash/noop');
const sum = require('lodash/sum');

const deserialize = (stdin) => {
	const lines = stdin.split('\n').filter((line) => line.length > 0);
	const beams = [];
	const pawns = [];
	const targets = [];
	const field = [];

	const [width, height] = lines[0].split(' ').map((token) => parseInt(token));

	lines.slice(2).forEach((l, y) => {
		const cells = l.split(' ');
		cells.forEach((cell, x) => {
			if (cell[0] === 'b') {
				const beam = {
					position: y * width + x,
					type: 'beam',
					id: parseInt(cell.slice(1)),
				};
				beams.push(beam);
				field.push('beam');
			} else if (cell[0] === 'p') {
				const pawn = {
					position: y * width + x,
					type: 'pawn',
					id: parseInt(cell.slice(1)),
				};
				pawns.push(pawn);
				field.push('empty');
			} else if (cell[0] === 't') {
				const target = {
					position: y * width + x,
					type: 'target',
					id: parseInt(cell.slice(1)),
				};
				targets.push(target);
				field.push('empty');
			} else if (cell === '*') {
				field.push('block');
			} else if (cell === 'x') {
				field.push('beam');
			} else {
				assert(cell === '.');
				field.push('empty');
			}
		});
	});

	return {
		state: {
			turn: lines[1][0],
			beams,
			pawns,
			targets,
			field,
		},
		params: {
			width,
			height,
		},
	};
};

module.exports.deserialize = deserialize;

const serialize = ({state, params}) => `${[
	`${params.width} ${params.height}`,
	state.turn,
	...range(params.height).map((y) => range(params.width)
		.map((x) => {
			const position = y * params.width + x;

			const target = state.targets.find((t) => t.position === position);
			if (target) {
				return `t${target.id}`;
			}

			const pawn = state.pawns.find((p) => p.position === position);
			if (pawn) {
				return `p${pawn.id}`;
			}

			const beam = state.beams.find((b) => b.position === position);
			if (beam) {
				return `b${beam.id}`;
			}

			if (state.field[position] === 'block') {
				return '*';
			}

			if (state.field[position] === 'beam') {
				return 'x';
			}

			assert(state.field[position] === 'empty');
			return '.';
		})
		.join(' ')),
].join('\n')}\n`;

const clone2D = (matrix) => matrix.map((row) => row.slice(0, row.length));

const parts = [
	`
	..**....*.
    *..**.....
    .....*...*
    .*........
    .......**.
    .......*..
    ***.......
    ..........
    *....*....
    .....*..*.
	`,
	`
	.*........
	..*.*.....
	....***...
	*.....*...
	....*.***.
	**........
	....**....
	....**..**
	.*......*.
	.*........
	`,
	`
	..*.......
	.**....*..
	........*.
	....**....
	....**....
	**.....*.*
	.*........
	...*.**...
	..........
	.*.....**.
	`,
	`
	..**....*.
	.*....**..
	.....*....
	*....*....
	..........
	....***...
	........**
	.*........
	.**..*....
	.....**...
	`,
	`
	....*...*.
	**...*....
	.......*..
	...*.*....
	....*.....
	...*.*....
	..........
	.*......**
	*..*..*...
	.....*..*.
	`,
	`
	...*....*.
	......*...
	..*......*
	*.*.......
	........*.
	....**...*
	.*...*.*..
	...*...*..
	*.........
	....*...*.
	`,
	`
	..**.....*
	*..*....*.
	..........
	.*...*..**
	......*...
	..*......*
	.*....*...
	...*...*..
	*..*....*.
	.....*....
	`,
	`
	.....**...
	*....**..*
	...*......
	...*...*.*
	*....*....
	.*..**...*
	..........
	...*......
	*.....*...
	....*...*.
	`,
	`
	......*...
	*.*.......
	..*.....**
	*........*
	...**.*...
	...**.....
	.*........
	*..*...***
	...*......
	....*.*...
	`,
	`
	.**.*.....
	..*..*....
	........*.
	*.........
	....**...*
	..*.**....
	**........
	*.....*...
	....*...*.
	.*..*.....`,
];

const baseCase = () => {
	samples = [];
	for (const part of parts) {
		const tmp = part
			.trim()
			.replace(/ +/g, '')
			.replace(/\t+/g, '')
			.split('\n');
		const map = tmp.map((x) => {
			const l = [];
			for (let i = 0; i < x.length; i++) {
				if (x[i] === '*') {
					l.push('block');
				} else {
					l.push('empty');
				}
			}
			return l;
		});
		samples.push(clone2D(map));
		for (let k = 0; k < 3; k++) {
			// rotate 90

			// transpose
			for (let i = 0; i < map[0].length; i++) {
				for (let j = i; j < map.length; j++) {
					const tmp = map[i][j];
					map[i][j] = map[j][i];
					map[j][i] = tmp;
				}
			}
			// reverse columns
			for (let i = 0; i < map[0].length; i++) {
				for (let j = 0; j < Math.floor(map.length / 2); j++) {
					const rev = map.length - j - 1;
					const tmp = map[j][i];
					map[j][i] = map[rev][i];
					map[rev][i] = tmp;
				}
			}
			samples.push(clone2D(map));
		}
	}
	return samples;
};

module.exports.serialize = serialize;

const deltas = new Map([
	['u', {x: 0, y: -1}],
	['l', {x: -1, y: 0}],
	['d', {x: 0, y: 1}],
	['r', {x: 1, y: 0}],
]);

const _evaluate = (field, visited, robots) => {
	const uldr = [[0, -1], [-1, 0], [0, 1], [1, 0]];
	// maximum recursionするかも...
	robots.forEach((robot, idx) => {
		for (const dirc of uldr) {
			const x = robot.x + dirc[0];
			const y = robot.y + dirc[1];
			if (x < 0 || x >= field[0].length || y < 0 || y >= field.length) {
				// continue
			} else if (field[y][x] === 'block' || field[y][x] === 'beam') {
				// continue
			} else if (visited[y][x]) {
				// continue
			} else {
				visited[y][x] = true;
				const tmpx = robot.x;
				const tmpy = robot.y;
				robots[idx] = {x, y};
				_evaluate(field, visited, robots);
				robots[idx] = {x: tmpx, y: tmpy};
			}
		}
	});
};

/*
> evaluate(['empty', 'block', 'empty', 'block'], {width:2, height:2}, [{position: 0}])
2
> evaluate(['empty', 'block', 'block', 'block'], {width:2, height:2}, [{position: 0}]);
1
> evaluate(['empty', 'block', 'empty', 'empty', 'block', 'empty', 'empty', 'block', 'empty'], {width:3, height:3}, [{position: 3}, {position: 5}]);
*/

const printField = (field, robots) => {
	s = '';
	field.forEach((row, j) => {
		row.forEach((x, i) => {
			let flag = true;
			for (const robot of robots) {
				if (robot.x === i && robot.y === j) {
					s += `${robot.type[0]} `;
					flag = false;
				}
			}
			if (flag) {
				if (x === 'empty') {
					s += '  ';
				} else if (x === 'block') {
					s += '* ';
				} else if (x === 'beam') {
					s += 'x ';
				}
			}
		});
		s += '\n';
	});
	console.log(s);
};

const field1DTo2D = (state, params) => {
	const field = [];
	const robotMap = [];
	const field1D = state.field;
	for (let i = 0; i < params.height; i++) {
		field.push(field1D.slice(params.width * i, params.width * (i + 1)));
		robotMap.push(Array(params.width).fill(false));
	}
	const robots = state.beams.slice(0, state.beams.length).concat(state.targets);
	for (const robot of robots) {
		robot.x = robot.position % params.width;
		robot.y = Math.floor(robot.position / params.width);
		robotMap[robot.y][robot.x] = robot;
	}
	return {field, robotMap};
};

const evaluate = (field, robots) => {
	const visited = field.map((row) => Array(row.length).fill(false));
	const robotPoses = robots.map((robot) => {
		visited[robot.y][robot.x] = true;
		return robot;
	});

	_evaluate(field, visited, robotPoses);
	let cnt = 0;
	for (const row of visited) {
		for (const x of row) {
			if (x) {
				cnt++;
			}
		}
	}
	return cnt;
};

const move = (field, robotMap, robot, delta) => {
	let x = robot.x;
	let y = robot.y;
	const mx = field[0].length;
	const my = field.length;

	// 捕まるロボット
	const killed = [];

	// 今ある場所からはいなくなる
	robotMap[y][x] = false;
	while (true) {
		x += delta[0];
		y += delta[1];
		if (x < 0 || y < 0 || mx <= x || my <= y) {
			robot.x = x - delta[0];
			robot.y = y - delta[1];
			robotMap[robot.y][robot.x] = robot;
			break;
		}
		// 進む先にロボットないし、ブロックがあったら止まる
		if (
			field[y][x] === 'block' ||
			(robotMap[y][x] && robotMap[y][x].type === 'beam')
		) {
			robot.x = x - delta[0];
			robot.y = y - delta[1];
			robotMap[robot.y][robot.x] = robot;
			break;
		} else if (field[y][x] === 'beam' && robot.type === 'target') {
			robot.x = x - delta[0];
			robot.y = y - delta[1];
			robotMap[robot.y][robot.x] = robot;
			break;
		} else {
			// emptyだったとき
			// もし自分がbeamなら、通る道をbeamとして埋めていく
			if (robot.type === 'beam') {
				field[y][x] = 'beam';
			}
			if (robotMap[y][x] && robotMap[y][x].type === 'target') {
				killed.push(robotMap[y][x]);
			}
		}
	}
	return killed;
};

/*
field = [['empty', 'empty', 'empty'], ['empty', 'empty', 'empty'],['empty', 'empty', 'empty']];
robot = {type: 'beam', x: 1, y: 1};
robotMap = [[false, false, false], [false, robot, false], [false, false, false]];
move(field, robotMap, robot, [-1, 0]);
*/

const attackCatMain = (field, robots, targets, robotMap, depth, params) => {
	let score = 1000000;
	const uldr = [[0, -1], [-1, 0], [0, 1], [1, 0]];
	if (depth == 0) {
		const tmp = evaluate(field, targets);
		return tmp;
	}
	for (const robot of robots) {
		for (const dirc of uldr) {
			const cloned = clone2D(field);
			const robotMapCloned = clone2D(robotMap);
			const {x, y} = {x: robot.x, y: robot.y};
			move(cloned, robotMapCloned, robot, dirc);
			if (robot.x != x || robot.y != y) {
				const tmp = attackCatMain(
					cloned,
					robots,
					targets,
					robotMapCloned,
					depth - 1,
					params
				);
				robot.x = x;
				robot.y = y;
				score = Math.min(score, tmp);
			}
		}
	}
	return score;
};

const checkKillable = (field, robotMap, beams, targets) => {
	const uldr = [[[0, -1], 'u'], [[-1, 0], 'l'], [[0, 1], 'd'], [[1, 0], 'r']];
	let id = -1;
	let direction = '';
	const set = new Set();
	for (const robot of beams) {
		for (const dirc of uldr) {
			const cloned = clone2D(field);
			const robotMapCloned = clone2D(robotMap);
			const {x, y} = {x: robot.x, y: robot.y};
			const killed = move(cloned, robotMapCloned, robot, dirc[0]);
			for (const robot of killed) {
				set.add(robot.id);
			}
			robot.x = x;
			robot.y = y;
			if (killed.length > 0) {
				id = robot.id;
				direction = dirc[1];
			}
		}
	}
	if (id != -1) {
		return {ok: true, move: `${id} ${direction}`, cnt: set.size};
	}
	return {ok: false, cnt: 0};
};

const attackCat = (state) => {
	const {field, robotMap} = field1DTo2D(state, state.params);
	const robots = state.beams;

	const killable = checkKillable(field, robotMap, state.beams, state.targets);
	if (killable.ok) {
		return killable.move;
	}
	// first randomly select robot/dirc
	const r = Math.floor(Math.random() * 4);
	let direction = r === 0 ? 'u' : r === 1 ? 'l' : r === 2 ? 'd' : 'r';
	let id = state.beams[Math.floor(Math.random() * state.beams.length)].id;

	const uldr = [[[0, -1], 'u'], [[-1, 0], 'l'], [[0, 1], 'd'], [[1, 0], 'r']];
	// shuffle
	for (let i = uldr.length - 1; i > 0; i--) {
		const r = Math.floor(Math.random() * (i + 1));
		const tmp = uldr[i];
		uldr[i] = uldr[r];
		uldr[r] = tmp;
	}
	for (let i = robots.length - 1; i > 0; i--) {
		const r = Math.floor(Math.random() * (i + 1));
		const tmp = robots[i];
		robots[i] = robots[r];
		robots[r] = tmp;
	}
	let score = evaluate(field, state.targets);

	for (const robot of robots) {
		for (const dirc of uldr) {
			const cloned = clone2D(field);
			const robotMapCloned = clone2D(robotMap);
			const {x, y} = {x: robot.x, y: robot.y};
			move(cloned, robotMapCloned, robot, dirc[0]);
			if (x != robot.x || y != robot.y) {
				const depth = robots.length < 3 ? 4 : robots.length == 3 ? 3 : 1;
				const tmp = attackCatMain(
					cloned,
					robots,
					state.targets,
					robotMapCloned,
					depth,
					state.params
				);
				robot.x = x;
				robot.y = y;
				if (tmp < score) {
					score = tmp;
					id = robot.id;
					direction = dirc[1];
				}
			}
		}
	}
	// console.log("bye:", score, id, direction);
	return `${id} ${direction}`;
};

const escapeCat = (state) => {
	const {field, robotMap} = field1DTo2D(state, state.params);
	const uldr = [[[0, -1], 'u'], [[-1, 0], 'l'], [[0, 1], 'd'], [[1, 0], 'r']];
	const robots = state.targets;
	let killedCnt = 1000000;
	// shuffle
	for (let i = uldr.length - 1; i > 0; i--) {
		const r = Math.floor(Math.random() * (i + 1));
		const tmp = uldr[i];
		uldr[i] = uldr[r];
		uldr[r] = tmp;
	}
	for (let i = robots.length - 1; i > 0; i--) {
		const r = Math.floor(Math.random() * (i + 1));
		const tmp = robots[i];
		robots[i] = robots[r];
		robots[r] = tmp;
	}

	for (const robot of robots) {
		for (const dirc of uldr) {
			const cloned = clone2D(field);
			const robotMapCloned = clone2D(robotMap);
			const {x, y} = {x: robot.x, y: robot.y};
			move(cloned, robotMapCloned, robot, dirc[0]);
			const killed = checkKillable(
				cloned,
				robotMapCloned,
				state.beams,
				state.targets
			);
			robot.x = x;
			robot.y = y;
			if (killed.cnt < killedCnt) {
				killedCnt = killed.cnt;
				id = robot.id;
				direction = dirc[1];
			}
		}
	}
	return `${id} ${direction}`;
};

module.exports.presets = {
	random: (stdin) => {
		const {state} = deserialize(stdin);
		let r = Math.floor(Math.random() * 4);
		const direction = r === 0 ? 'u' : r === 1 ? 'l' : r === 2 ? 'd' : 'r';
		if (state.turn === 'A') {
			const size = state.beams.length + state.pawns.length;
			const r = Math.floor(Math.random() * size);
			if (r < state.beams.length) {
				return `${state.beams[r].id} ${direction}`;
			}
			return `${state.pawns[r - state.beams.length].id} ${direction}`;
		}
		r = Math.floor(Math.random() * state.targets.length);
		return `${state.targets[r].id} ${direction}`;
	},
	cat: (stdin) => {
		const {state, params} = deserialize(stdin);
		state.params = params;
		if (state.turn == 'A') {
			return attackCat(state);
		}
		return escapeCat(state);
	},
};

module.exports.battler = async (
	execute,
	params,
	{onFrame = noop, initState} = {}
) => {
	const random = seedrandom(params.seed || 'hoga');
	const getXY = (index) => ({
		x: index % params.width,
		y: Math.floor(index / params.width),
	});
	const inField = ({x, y}) => x >= 0 && x < params.width && y >= 0 && y < params.height;
	const sampleSize = (items, size) => {
		const clones = items.slice();
		for (const index of Array(size).keys()) {
			const target = Math.floor(random() * (clones.length - index)) + index;
			const temp = clones[target];
			clones[target] = clones[index];
			clones[index] = temp;
		}
		return clones.slice(0, size);
	};
	const _checkConnectivity = (field, startX, startY, visited) => {
		const uldr = [[0, -1], [-1, 0], [0, 1], [1, 0]];
		for (const dirc of uldr) {
			const x = startX + dirc[0];
			const y = startY + dirc[1];
			if (x < 0 || x >= field[0].length || y < 0 || y >= field.length) {
				// continue
			} else if (field[y][x] == 'block') {
				// continue
			} else if (visited[y][x]) {
				// continue
			} else {
				visited[y][x] = true;
				_checkConnectivity(field, x, y, visited);
			}
		}
	};

	const checkConnectivity = (field1D) => {
		const field = [];
		const visited = [];
		for (let i = 0; i < params.height; i++) {
			field.push(field1D.slice(params.width * i, params.width * (i + 1)));
		}
		let startX = -1;
		let startY = -1;
		field.forEach((row, j) => {
			visited.push(row.map((_) => false));
			row.forEach((x, i) => {
				if (x == 'empty') {
					startX = i;
					startY = j;
				}
			});
		});
		visited[startY][startX] = true;
		_checkConnectivity(field, startX, startY, visited);

		let result = true;
		field.forEach((row, j) => {
			row.forEach((x, i) => {
				if (x === 'empty' && visited[j][i] === false) {
					result = false;
				}
			});
		});
		return result;
	};

	const initialState =
		initState ||
		(() => {
			const field = Array(params.width * params.height).fill('empty');
			if (
				params.useVerified &&
				params.width % 10 == 0 &&
				params.height % 10 == 0
			) {
				const samples = baseCase();
				let ptr = 0;
				for (let i = 0; i < Math.floor(params.width / 10); i++) {
					for (let j = 0; j < Math.floor(params.height / 10); j++) {
						const idx = Math.floor(random() * samples.length);
						const sample = samples[idx];
						for (const row of sample) {
							for (const x of row) {
								field[ptr] = x;
								ptr++;
							}
						}
					}
				}
			} else {
				for (let i = 0; i < params.width * params.height * 0.1; i++) {
					while (true) {
						const idx = Math.floor(random() * params.width * params.height);
						if (field[idx] === 'empty') {
							field[idx] = 'block';
							if (checkConnectivity(field)) {
								break;
							}
							field[idx] = 'empty';
						}
					}
				}
			}
			const beams = sampleSize(
				range(params.width * params.height).filter(
					(position) => field[position] === 'empty'
				),
				params.beams
			).map((position, index) => ({
				position,
				type: 'beam',
				id: index,
			}));

			const pawns = sampleSize(
				range(params.width * params.height).filter(
					(position) => field[position] === 'empty' &&
						beams.every((beam) => beam.position !== position)
				),
				params.pawns
			).map((position, index) => ({
				position,
				type: 'pawn',
				id: index + params.beams,
			}));

			const targets = sampleSize(
				range(params.width * params.height).filter(
					(position) => field[position] === 'empty' &&
						beams.every((beam) => beam.position !== position) &&
						pawns.every((pawn) => pawn.position !== position)
				),
				params.targets
			).map((position, index) => ({
				position,
				type: 'taget',
				id: index + params.beams + params.pawns,
			}));

			for (const beam of beams) {
				field[beam.position] = 'beam';
			}

			return {
				turn: 'D',
				field,
				targets,
				pawns,
				beams,
			};
		})();

	const state = {
		...deserialize(serialize({state: initialState, params})).state,
		turns: 0,
	};

	while (state.turns < 300) {
		const {stdout} = await execute(
			serialize({state, params}),
			state.turn === 'A' ? 0 : 1
		);
		const tokens = (stdout || '')
			.toString()
			.trim()
			.split(/\s+/);
		const id = parseInt(tokens[0]) || 0;
		const direction = deltas.has(tokens[1]) ? tokens[1] : 'u';

		let robot = [...state.beams, ...state.pawns, ...state.targets].find(
			(obj) => obj.id === id
		);

		if (
			state.turn === 'A' &&
			(robot === undefined || !['beam', 'pawn'].includes(robot.type))
		) {
			robot = state.beams[0];
		}

		if (
			state.turn === 'D' &&
			(robot === undefined || robot.type !== 'target')
		) {
			robot = state.targets[0];
		}

		const delta = deltas.get(direction);
		const position = getXY(robot.position);

		while (1) {
			const newX = position.x + delta.x;
			const newY = position.y + delta.y;

			if (!inField({x: newX, y: newY})) {
				break;
			}

			const newIndex = newY * params.width + newX;
			if (state.field[newIndex] === 'block') {
				break;
			}
			if (robot.type === 'target' && state.field[newIndex] === 'beam') {
				break;
			}
			if (
				[
					...state.beams,
					...state.pawns,
					...(robot.type === 'beam' ? [] : state.targets),
				].some((o) => o.position === newIndex)
			) {
				break;
			}

			position.x = newX;
			position.y = newY;

			if (robot.type === 'beam') {
				state.field[newIndex] = 'beam';
				state.targets = state.targets.filter(
					(target) => target.position !== newIndex
				);
			}
		}

		robot.position = position.y * params.width + position.x;

		onFrame({state});

		state.turn = state.turn === 'D' ? 'A' : 'D';
		state.turns++;

		if (state.targets.length === 0) {
			break;
		}
	}

	return {
		result: 'draw',
		winner: null,
		scores: [state.turns, 0],
	};
};

module.exports.configs = [
	{
		default: true,
		id: 'default',
		name: 'Default',
		params: {
			width: 10,
			height: 10,
			beams: 2,
			targets: 2,
			pawns: 0,
			useVerified: false,
		},
	},
	{
		default: false,
		id: '10x10',
		name: '10x10',
		params: {
			width: 10,
			height: 10,
			beams: 3,
			targets: 2,
			pawns: 0,
			useVerified: true,
		},
	},
	{
		default: false,
		id: '20x20',
		name: '20x20',
		params: {
			width: 20,
			height: 20,
			beams: 10,
			targets: 3,
			pawns: 0,
			useVerified: true,
		},
	},
	{
		default: false,
		id: '30x30',
		name: '30x30',
		params: {
			width: 30,
			height: 30,
			beams: 20,
			targets: 5,
			pawns: 0,
			useVerified: true,
		},
	},
];

const matchConfigs = [
	...Array(10 * 2)
		.fill()
		.map((_, i) => ({
			config: '10x10',
			players: [i % 2, (i + 1) % 2],
			seed: Math.floor(i / 2),
			score: 40,
		})),
	...Array(3 * 2)
		.fill()
		.map((_, i) => ({
			config: '20x20',
			players: [i % 2, (i + 1) % 2],
			seed: 20 + Math.floor(i / 2),
			score: 100,
		})),
	...Array(1 * 2)
		.fill()
		.map((_, i) => ({
			config: '30x30',
			players: [i % 2, (i + 1) % 2],
			seed: 26 + Math.floor(i / 2),
			score: 200,
		})),
];

module.exports.matchConfigs = matchConfigs;

module.exports.judgeMatch = (results) => {
	let score1 = 0;
	let score2 = 0;
	for (let i = 0; i < Math.floor(results.length / 2); i++) {
		const tmp1 = results[2 * i].scores[matchConfigs[2 * i].players[0]];
		const tmp2 = results[2 * i + 1].scores[matchConfigs[2 * i + 1].players[1]];
		if (tmp1 < tmp2) {
			score1 += matchConfigs[2 * i].score;
		}
		if (tmp1 > tmp2) {
			score2 += matchConfigs[2 * i + 1].score;
		}
	}

	if (score1 === score2) {
		return {
			result: 'draw',
			winner: null,
			scores: [score1, score2],
		};
	}

	return {
		result: 'settled',
		winner: score1 < score2 ? 1 : 0,
		scores: [score1, score2],
	};
};
