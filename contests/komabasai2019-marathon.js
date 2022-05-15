/* eslint array-plural/array-plural: off */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const noop = require('lodash/noop');
const sumBy = require('lodash/sumBy');
const isEqual = require('lodash/isEqual');
const bigRat = require('big-rational');

const presets = {};

const initSeqs = (length, upper_bound) => {
	const usedNumbers = new Set();
	const newNumber = (usedNum, upper_bound) => {
		let ret = 0;
		do {
			ret = 1 + Math.floor(Math.random() * upper_bound);
		} while (usedNum.has(ret));
		usedNum.add(ret);
		return ret;
	};
	const sequence = Array(length).fill(0).map((index) => ({
		num: newNumber(usedNumbers, upper_bound),
	}));
	return sequence;
};


const getUsedNum = (stdout) => {
	const usedNum = stdout.toString().trim().split('\n')[0].replace(/[+\-*/ ()]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map((token) => parseInt(token)).sort();
	return usedNum;
};


const normalize = (stdout) => {
	const infixFormula = stdout.toString().trim().replace(/\s*([+\-*/()])\s*/g, '$1').replace(/ +/g, '^').replace(/[+\-*/^()]/g, ' $& ').replace(/\s+/g, ' ').trim().split(' ');
	return infixFormula;
};


const deserialize = (stdin) => {
	const lines = stdin.split('\n').filter((line) => line.length > 0);
	const length = parseInt(lines[0]);
	const sequence = lines[1].split(' ').map((token) => parseInt(token)).sort();

	return {
		state: {
			sequence,
			score: 0,
		},
		params: {
			length,
		},
	};
};


const serialize = ({state, params}) => `${[
	`${params.length}`,
	state.sequence.map((cell) => cell.num.toString()).join(' '),
].join('\n')}\n`;


const parse = (infixFormula) => {
	const operatorStack = [];
	const operandStack = [];
	const level0Operator = ['^'];
	const level1Operator = ['*', '/', '^'];
	const level2Operator = ['+', '-', '*', '/', '^'];
	let topRawNumber = 0;
	const operation = () => {
		if (operandStack.length < 2) {
throw new Error('InvalidFormula');
}
		const rhs = operandStack.pop();
		const lhs = operandStack.pop();
		const operator = operatorStack.pop();
		if (operator === '+') {
			topRawNumber = 0;
			operandStack.push({type: 'operation', operator: '+', lhs, rhs});
		} else if (operator === '-') {
			topRawNumber = 0;
			operandStack.push({type: 'operation', operator: '-', lhs, rhs});
		} else if (operator === '*') {
			topRawNumber = 0;
			operandStack.push({type: 'operation', operator: '*', lhs, rhs});
		} else if (operator === '/') {
			topRawNumber = 0;
			operandStack.push({type: 'operation', operator: '/', lhs, rhs});
		} else {
			if (topRawNumber < 2) {
throw new Error('InvalidFormula');
}
			--topRawNumber;
			operandStack.push({type: 'chain', lhs, rhs});
		}
	};
	for (const token of infixFormula) {
		if (token === '+' || token === '-') {
			while (operatorStack.length > 0 && level2Operator.includes(operatorStack[operatorStack.length - 1])) {
				operation();
			}
			operatorStack.push(token);
		} else if (token === '*' || token === '/') {
			while (operatorStack.length > 0 && level1Operator.includes(operatorStack[operatorStack.length - 1])) {
				operation();
			}
			operatorStack.push(token);
		} else if (token === '^') {
			while (operatorStack.length > 0 && level0Operator.includes(operatorStack[operatorStack.length - 1])) {
				operation();
			}
			operatorStack.push(token);
		} else if (token === '(') {
			operatorStack.push(token);
		} else if (token === ')') {
			while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
				operation();
			}
			if (operatorStack.length === 0) {
throw new Error('InvalidFormula');
}
			operatorStack.pop();
			const body = operandStack.pop();
			operandStack.push({type: 'parenthesization', body});
		} else {
			operandStack.push({type: 'literal', value: bigRat(token)});
			++topRawNumber;
		}
	}
	while (operatorStack.length > 0) {
		if (!level2Operator.includes(operatorStack[operatorStack.length - 1])) {
throw new Error('InvalidFormula');
}
		operation();
	}
	if (operandStack.length !== 1) {
throw new Error('InvalidFormula');
}
	return operandStack.pop();
};


const evaluate = (syntaxTree) => {
	switch (syntaxTree.type) {
		case 'literal': {
			return syntaxTree.value;
		}
		case 'operation': {
			const lhs = evaluate(syntaxTree.lhs);
			const rhs = evaluate(syntaxTree.rhs);
			switch (syntaxTree.operator) {
				case '+': return lhs.add(rhs);
				case '-': return lhs.subtract(rhs);
				case '*': return lhs.multiply(rhs);
				case '/': {
					if (rhs.equals(bigRat.zero)) {
throw new Error('DivisionByZero');
}
					return lhs.divide(rhs);
				}
			}
			break;
		}
		case 'chain': {
			const lhs = evaluate(syntaxTree.lhs);
			const rhs = evaluate(syntaxTree.rhs);
			return bigRat(lhs.num.toString() + rhs.num.toString());
		}
		case 'parenthesization': {
			return evaluate(syntaxTree.body);
		}
	}
};


const myLog10 = (bigRatio) => {
	const sign = bigRatio.lt(1);
	const intLog = Math.abs(bigRatio.num.toString().length - bigRatio.denom.toString().length);
	if (sign) {
		bigRatio = bigRatio.multiply(bigRat('10').pow(intLog));
	} else {
		bigRatio = bigRatio.multiply(bigRat('1', '10').pow(intLog));
	}
	return Math.log10(bigRatio) - (sign ? intLog : -intLog);
};


const battler = async (
	execute,
	params,
	{onFrame = noop, initState} = {},
) => {
	const sequence = initSeqs(params.length, params.upper_bound);
	const initialState = initState || {
		score: 0,
		sequence,
	};
	const {state} = deserialize(serialize({params, state: initialState}));
	const {stdout} = await execute(serialize({params, state: initialState}), 0);
	const infixFormula = normalize(stdout, params);
	const usedNumbers = getUsedNum(stdout, params);
	if (isEqual(usedNumbers, state.sequence)) {
		try {
			const syntaxTree = parse(infixFormula);
			const result = evaluate(syntaxTree);
			const error = bigRat(100).subtract(result).abs();
			state.score = 1e12 - Math.floor(myLog10(error.add(1)) * 100000000);
		} catch (e) {
			state.score = 0;
		}
	} else {
		if (usedNumbers.length <= 20) {
			console.log(usedNumbers);
			console.log(state.sequence);
		}
		state.score = 0;
	}
	return {
		result: 'settled',
		winner: 0,
		scores: [state.score],
	};
};

const configs = [
	{
		default: true,
		id: 'baby',
		name: 'komachi baby',
		params: {
			mode: 'one-path',
			length: 9,
			upper_bound: 9,
		},
	},
	{
		id: 'small',
		name: '5 small',
		params: {
			mode: 'random',
			length: 5,
			upper_bound: 9,
		},
	},
	{
		id: 'middle',
		name: '20 middle',
		params: {
			mode: 'random',
			length: 20,
			upper_bound: 99,
		},
	},
	{
		id: 'large',
		name: '1000 large',
		params: {
			mode: 'random',
			length: 1000,
			upper_bound: 99999999,
		},
	},
];


const matchConfigs = [
	...Array(1)
		.fill()
		.map(() => ({
			config: 'baby',
			players: [0],
		})),
	...Array(3)
		.fill()
		.map(() => ({
			config: 'small',
			players: [0],
		})),
	...Array(3)
		.fill()
		.map(() => ({
			config: 'middle',
			players: [0],
		})),
	...Array(3)
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
	deserialize,
	serialize,
	initSeqs,
	getUsedNum,
	normalize,
	parse,
	evaluate,
	myLog10,
	presets,
	battler,
	configs,
	matchConfigs,
	judgeMatch
}