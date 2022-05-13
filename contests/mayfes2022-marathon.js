const { stripIndents } = require('common-tags')
const { sumBy } = require('lodash')

const parseInput = (stdin) => {
  const lines = stdin.toString().split('\n')
  lines.shift() // Test case ID
  const [n,k] = lines.shift().split(' ').map((x) => parseInt(x))
  console.log(n,k)
  return {
    perm: lines.shift().split(' ').map((x) => parseInt(x)),
	  cost: lines.shift().split(' ').map((x) => parseInt(x)),
    n,
		k,
  }
}

const parseOutput = (stdout, n) => {
  const lines = stdout.toString().split('\n')
  console.log(lines)
  const m = parseInt(lines.shift())
  if (isNaN(m)) {
    throw new Error('Invalid Answer: operation count not specified')
  }
  if (m*2 > n*(n-1)) {
    throw new Error('Invalid Answer: operation limit exceeded')
  }
  return lines.slice(0, m).map((l) => {
    const arr = l.split(' ')
    if (arr.length !== 2) {
      throw new Error('Invalid Answer: each line must contain 2 entries')
    }
    const ints = arr.map(x => parseInt(x))
    const left = ints[0] - 1
    const right = ints[1]
    if (left < 0 || left >= right || right > n) {
      throw new Error('Invalid Answer: invalid indices')
    }
    return {
      left, right
    }
  })
}

const inverseCount = (sliced, length) =>{
  let count = 0
	for (let i = 0; i < length; i++) {
    for (let j = i + 1; j < length; j++){
	    if (sliced[i] > sliced[j]){
			  count++
		  }
	  }
  }
	return count
}

const runStep = ({ perm, cost, n, k }, costSoFar, { left, right }) => {
  const c = inverseCount(perm.slice(left, right), right - left)
	const stepCost = cost.slice(left,right).reduce(function(sum, element){
		return sum + element
	}, 0)
	costSoFar += stepCost
  if (c <= k) {
    let perm0 = perm.slice(0,left)
		let perm1 = perm.slice(left,right)
    perm1.sort((a,b) => a - b)
		let perm2 = perm.slice(right)
		perm = perm0.concat(perm1).concat(perm2)
  }
  return [perm,costSoFar]
}

// const checkReference = (map, x0, x1, y0, y1, ref) => {
//   let count = 0
//   for (let i = y0; i < y1; i++) {
//     for (let j = x0; j < x1; j++) {
//       if (map[i][j] !== ref) {
//         count++
//       }
//     }
//   }
//   return count
// }

const battler = async (execute, { input }) => {
  const stdin = parseInput(input)
	let {perm, cost, n, k} = stdin
	let costSoFar = 0
  try {
    const { stdout } =await execute(input, 0)

    const operations = parseOutput(stdout, n)

    console.log(`before: ${perm}`)

    operations.forEach((op) => [perm,costSoFar] = runStep({perm, cost, n, k}, costSoFar, op))

    console.log(`after: ${perm}`)

    const i = inverseCount(perm, n)

		costSoFar += i * 200

    const costSum = cost.reduce(function(sum, element){
      return sum + element
    }, 0)

    return {
      result: 'settled',
      winner: 0,
      scores: [Math.floor(10 ** 5 * costSum ** 2 / (1 + costSoFar ** 2))],
    }
  } catch (e) {
    console.log(`judge failed: ${e}`)
    console.log(e.stack)
    return {
      result: 'settled',
      winner: 0,
      scores: [0],
    }
  }
}


const cases = [
  stripIndents`1
4 2
3 4 2 1
1 2 3 4
  `,
  stripIndents`2
6 5
2 4 1 5 6 3
1 10 5 2 3 9
  `,
  stripIndents`3
8 6
8 7 6 5 4 3 2 1
1 1 1 1 1 1 1 1
  `,
  stripIndents`4
  9 33
  3 6 7 8 5 1 2 9 4
  99 62 68 91 17 48 87 22 40
  `,
  stripIndents`5
  9 7
  6 1 2 5 4 9 3 7 8
  36 24 89 64 87 22 1 64 74
  `,
  stripIndents`6
  16 116
  1 4 10 2 6 14 5 9 7 13 12 15 11 16 3 8
  63 93 13 45 34 12 50 61 77 88 72 98 23 36 65 70
  `,
  stripIndents`7
  12 9
  11 10 2 8 3 6 12 1 9 5 4 7
  89 89 37 31 84 10 74 76 73 6 66 46
  `,
  stripIndents`8
  26 288
  5 6 24 2 18 16 7 1 3 10 26 9 13 20 23 8 25 21 22 14 12 4 11 15 17 19
  16 70 43 78 58 82 34 90 16 37 74 67 95 44 54 72 36 66 87 61 95 39 85 5 33 95
  `,
  stripIndents`9
  4 9
  4 3 2 1
  66 61 88 23
  `,
  stripIndents`10
  18 2
  15 10 17 1 3 4 16 8 5 11 18 7 2 12 6 14 13 9
  41 38 52 31 47 18 28 60 50 48 88 58 99 19 72 38 45 65
  `]

const caseNum = 10

const configs = [
  ...Array(caseNum)
    .fill(0)
    .map((_, i) => (
      {
        id: `case-${i + 1}`,
        name: `case ${i + 1}`,
        params: {
          input: cases[i],
        },
      })),
]

const matchConfigs = [
  ...Array(caseNum)
    .fill(0)
    .map((_, i) => ({
      config: `case-${i + 1}`,
      players: [0],
    })),
]

const judgeMatch = (results) => ({
  result: results[0].result,
  winner: results[0].winner,
  scores: [sumBy(results, ({ scores }) => scores[0])],
})

module.exports = {
  parseInput,
  parseOutput,
  inverseCount,
  battler,
  configs,
  matchConfigs,
  judgeMatch,
}