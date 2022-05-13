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
21 147
8 10 19 20 11 13 16 12 9 1 21 17 5 7 15 18 6 3 4 14 2
70 6 21 51 42 10 31 38 97 94 76 6 7 56 58 52 9 70 56 52 41
`,
stripIndents`5
4 3
1 2 4 3
65 20 72 65
`,
stripIndents`6
23 9
13 18 7 12 14 4 16 8 21 17 3 15 23 20 6 19 9 11 2 22 5 10 1
31 76 2 19 14 96 49 4 67 4 95 54 100 29 60 20 88 10 4 80 71 64 26
`,
stripIndents`7
14 5
2 14 9 4 5 8 10 7 1 11 13 3 12 6
49 72 65 98 99 26 86 23 33 11 22 15 8 71
`,
stripIndents`8
2 2
2 1
49 35
`,
stripIndents`9
15 4
14 15 13 8 2 12 11 4 1 5 6 3 7 9 10
58 10 35 92 75 40 17 50 56 61 2 93 59 12 25
`,
stripIndents`10
27 1
11 2 9 14 15 18 6 3 13 25 12 4 1 5 7 21 23 24 17 10 26 8 19 22 27 20 16
4 46 37 91 81 77 83 71 87 13 28 43 47 88 78 15 77 46 44 77 91 42 28 88 60 23 46
`,
stripIndents`11
23 2
12 3 4 16 17 1 18 13 6 9 19 5 11 14 2 22 8 7 21 20 10 15 23
16 84 100 30 43 53 62 48 64 23 43 6 42 44 66 14 79 94 58 85 73 1 7
`,
stripIndents`12
4 4
3 2 4 1
86 46 59 68
`,
stripIndents`13
20 40
10 8 19 3 16 14 13 15 5 7 17 4 11 1 18 9 2 12 20 6
16 66 1 10 30 67 91 34 88 32 11 28 85 36 37 60 16 78 44 35
`,
stripIndents`14
8 32
1 2 3 5 4 7 6 8
79 3 54 34 4 61 19 83
`,
stripIndents`15
15 37
7 14 15 13 8 12 10 1 3 2 4 5 9 11 6
54 61 81 7 27 2 40 88 87 29 78 8 99 62 33
`,
stripIndents`16
21 1
15 19 21 5 13 7 16 17 9 20 2 1 6 8 10 4 14 18 3 11 12
11 5 76 66 95 78 85 31 4 12 39 88 36 58 77 92 44 23 85 24 64
`,
stripIndents`17
16 2
14 13 3 12 11 7 5 9 10 1 15 8 4 2 16 6
84 55 31 51 78 92 49 80 67 29 34 16 67 71 71 40
`,
stripIndents`18
5 5
5 4 2 1 3
27 44 48 15 85
`,
stripIndents`19
25 96
23 21 17 12 11 15 13 19 7 22 5 14 6 20 9 4 10 18 16 25 1 2 24 8 3
5 78 55 39 59 90 82 98 76 29 67 37 7 12 33 47 36 66 59 83 51 51 52 35 94
`,
stripIndents`20
8 1
5 6 3 2 8 1 7 4
72 24 36 52 18 82 37 5
`,
stripIndents`21
19 14
10 3 17 11 14 1 13 15 4 16 18 6 19 12 8 7 2 5 9
8 74 43 39 78 91 19 72 54 79 28 91 97 1 64 44 5 7 30
`,
stripIndents`22
29 168
24 3 5 4 9 25 28 19 2 18 17 10 1 14 29 20 27 26 7 8 21 12 11 13 6 22 16 15 23
62 89 73 45 47 93 39 24 9 55 99 88 17 37 52 60 46 85 83 71 92 28 68 6 90 98 10 3 97
`,
stripIndents`23
24 121
18 19 6 12 20 15 8 11 9 17 23 16 1 7 5 21 22 13 14 2 24 10 4 3
55 86 13 44 56 83 60 44 37 27 64 16 18 59 36 2 91 57 83 86 55 99 92 64
`,
stripIndents`24
4 6
3 2 4 1
96 62 6 94
`,
stripIndents`25
25 1
22 11 17 25 5 1 9 4 7 12 15 24 6 8 18 20 16 19 3 10 14 23 13 2 21
48 42 41 73 86 54 93 72 56 50 65 8 45 86 63 45 14 69 86 55 95 9 51 83 34
`,
stripIndents`26
20 1
10 3 7 13 12 18 1 6 8 16 5 19 17 14 4 2 9 15 11 20
4 28 76 26 67 64 98 61 2 85 78 33 16 54 19 72 90 27 13 60
`,
stripIndents`27
27 28
12 21 18 25 10 27 2 26 19 24 20 8 5 22 7 17 4 3 6 11 1 13 14 9 23 16 15
95 64 54 76 38 74 50 73 26 65 46 99 4 66 59 100 55 16 49 22 94 86 37 29 54 86 50
`,
stripIndents`28
21 21
13 3 18 12 5 9 6 17 8 20 21 7 11 2 16 19 4 15 10 1 14
72 55 80 99 71 25 70 29 39 27 79 37 99 38 68 81 31 32 16 4 78
`,
stripIndents`29
10 1
6 5 10 3 1 4 8 7 2 9
88 7 76 57 61 72 17 65 97 50
`,
stripIndents`30
21 2
8 21 5 19 15 11 3 7 16 18 2 1 14 12 4 6 17 13 20 9 10
27 65 20 81 18 90 68 7 11 48 96 23 57 59 48 51 60 21 83 38 96
`,
stripIndents`31
29 1
16 14 7 8 24 2 11 13 4 17 6 27 23 10 25 22 20 5 3 12 21 18 19 15 29 26 9 28 1
72 21 57 91 50 28 21 61 75 76 80 70 44 16 10 10 70 39 20 70 57 86 1 86 43 79 49 26 62
`,
stripIndents`32
9 1
1 7 3 9 8 2 5 4 6
22 86 2 18 55 79 39 19 61
`,
stripIndents`33
19 19
17 18 12 15 11 6 16 1 7 10 4 3 5 8 19 9 13 14 2
86 69 8 8 81 92 74 39 16 96 61 35 38 27 89 90 98 53 19
`,
stripIndents`34
4 4
4 3 1 2
7 28 9 16
`,
stripIndents`35
3 3
1 3 2
11 1 39
`,
stripIndents`36
11 6
5 10 9 2 7 3 6 8 4 11 1
27 93 31 36 74 39 64 41 90 32 33
`,
stripIndents`37
20 87
3 9 7 19 5 14 16 2 18 1 17 13 20 15 8 10 11 12 4 6
42 46 100 72 12 3 77 83 51 70 49 79 38 63 51 30 56 99 64 39
`,
stripIndents`38
30 256
22 10 30 15 21 6 8 9 5 23 16 14 26 29 18 20 28 4 24 27 25 7 3 12 1 13 19 11 2 17
31 36 2 38 44 51 52 74 54 80 63 5 63 60 16 32 44 33 95 41 26 38 54 14 18 89 39 99 94 64
`,
stripIndents`39
25 10
7 10 22 4 9 12 14 6 19 5 15 17 16 24 13 3 18 23 20 25 1 21 8 11 2
36 19 90 18 99 68 87 82 30 1 39 100 20 82 3 46 68 1 53 3 31 61 51 3 83
`,
stripIndents`40
25 103
23 12 9 10 2 25 3 18 20 17 14 7 11 21 4 5 13 15 16 24 19 1 6 8 22
97 39 90 36 1 74 62 46 95 92 76 67 35 32 66 64 55 37 5 76 84 22 36 29 77
`,
stripIndents`41
25 146
10 12 20 18 6 24 11 15 25 1 3 21 5 14 23 8 17 19 13 16 4 22 2 9 7
44 69 95 91 39 71 82 59 39 72 73 86 98 88 93 80 54 67 11 22 10 80 97 76 56
`,
stripIndents`42
15 3
3 8 9 13 4 15 14 10 11 12 1 7 5 6 2
17 81 61 62 21 59 19 6 64 54 72 11 28 3 95
`,
stripIndents`43
13 49
10 4 7 1 9 8 2 12 3 11 6 13 5
86 21 94 62 32 28 24 73 3 89 49 33 98
`,
stripIndents`44
6 17
6 4 2 3 1 5
75 10 21 88 11 55
`,
stripIndents`45
18 1
3 17 13 9 5 18 11 16 6 15 8 7 4 10 2 14 1 12
32 87 12 73 54 99 2 11 94 100 75 21 83 46 40 91 10 5
`,
stripIndents`46
18 86
18 7 1 12 14 9 8 5 10 4 16 11 2 3 6 15 13 17
25 29 81 88 16 25 83 86 96 55 4 61 74 44 38 21 58 50
`,
stripIndents`47
16 4
6 12 13 2 4 3 11 10 1 16 5 15 9 7 14 8
73 39 72 96 8 46 62 87 62 36 55 66 32 49 12 77
`,
stripIndents`48
7 23
3 4 6 7 2 5 1
51 53 78 41 33 98 29
`,
stripIndents`49
8 20
6 5 1 7 8 4 2 3
55 36 52 81 31 47 84 64
`,
stripIndents`50
18 82
15 2 7 12 3 9 8 18 11 10 6 17 4 1 13 5 14 16
68 20 1 96 74 18 19 16 93 28 38 35 74 26 68 94 17 2
`]

const caseNum = cases.length

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