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
15 101
15 7 13 6 3 8 5 14 4 9 1 11 10 12 2
39 43 11 69 83 76 80 51 21 21 57 76 91 3 16
`,
stripIndents`5
29 73
29 4 8 23 14 1 3 28 11 9 15 17 18 2 27 21 13 24 7 20 25 12 6 10 26 22 5 16 19
84 2 42 61 96 90 58 43 18 76 3 34 20 46 27 36 54 12 85 43 65 62 38 7 32 36 27 33 30
`,
stripIndents`6
5 3
3 1 2 4 5
79 98 50 39 98
`,
stripIndents`7
29 17
1 4 7 25 22 19 5 15 28 13 21 10 12 9 20 27 24 23 11 6 18 16 2 29 3 17 14 8 26
29 99 52 73 80 24 52 94 24 66 48 78 52 43 34 41 56 64 53 6 54 11 60 67 97 97 26 41 51
`,
stripIndents`8
15 48
3 8 15 12 5 7 11 4 13 14 1 2 10 9 6
14 51 75 78 26 74 29 14 87 69 85 18 5 33 100
`,
stripIndents`9
4 3
4 2 1 3
6 45 76 9
`,
stripIndents`10
30 3
14 4 22 19 2 13 7 12 25 3 15 9 8 29 23 20 24 17 5 16 26 28 11 18 27 6 10 21 30 1
10 44 96 98 43 91 56 36 23 83 12 82 8 69 4 96 81 71 82 48 13 43 59 70 35 85 95 55 4 93
`,
stripIndents`11
20 3
15 11 3 9 10 2 7 12 20 4 18 14 8 17 19 13 16 5 6 1
71 58 98 28 32 60 16 62 1 42 27 23 73 60 60 44 3 17 60 100
`,
stripIndents`12
7 11
4 1 3 2 7 6 5
54 90 35 17 87 92 93
`,
stripIndents`13
20 14
12 16 17 9 8 2 10 4 13 6 20 14 1 11 7 5 3 15 19 18
55 68 14 49 76 8 23 81 74 47 83 41 17 78 78 48 92 78 30 100
`,
stripIndents`14
16 27
3 6 13 14 12 9 7 5 1 11 8 4 10 2 16 15
65 42 23 20 28 38 15 95 44 91 80 66 21 8 88 74
`,
stripIndents`15
26 9
16 22 17 24 25 13 20 23 10 15 11 12 14 19 9 7 21 18 8 6 3 2 4 5 1 26
2 25 75 34 51 69 58 78 29 13 23 64 44 78 2 54 5 45 35 24 95 83 44 57 13 61
`,
stripIndents`16
11 8
10 8 5 7 2 9 3 1 11 6 4
20 20 79 74 20 22 59 24 10 56 54
`,
stripIndents`17
11 41
5 8 7 4 10 9 1 6 3 2 11
89 15 15 23 85 12 16 75 78 48 74
`,
stripIndents`18
6 3
5 4 2 6 1 3
3 98 32 92 56 12
`,
stripIndents`19
13 60
6 12 3 5 7 13 8 4 9 11 2 10 1
34 42 84 89 49 6 36 25 73 43 96 4 59
`,
stripIndents`20
17 149
2 8 1 15 10 6 14 5 9 17 16 12 11 3 7 4 13
38 74 49 1 17 15 96 10 31 34 39 40 67 61 29 36 26
`,
stripIndents`21
8 3
6 4 3 1 2 7 8 5
39 19 2 90 62 73 58 50
`,
stripIndents`22
7 25
7 3 1 5 6 2 4
65 91 12 74 61 50 34
`,
stripIndents`23
26 108
26 8 5 2 20 6 24 13 18 21 16 12 25 4 3 23 15 1 7 10 14 9 19 11 22 17
76 98 71 23 68 62 56 26 34 76 66 79 3 56 65 77 78 58 77 36 58 76 39 90 68 41
`,
stripIndents`24
27 3
13 25 19 15 6 10 11 2 20 7 14 23 24 26 12 18 27 1 17 5 9 8 4 21 16 3 22
24 17 92 48 6 29 13 58 11 99 30 59 22 60 12 55 99 64 42 32 46 60 3 65 64 76 56
`,
stripIndents`25
15 23
8 12 5 9 4 10 2 11 13 15 14 1 7 6 3
61 15 64 92 23 23 39 17 73 86 8 92 90 57 92
`,
stripIndents`26
16 14
15 1 13 8 9 5 6 14 2 3 4 7 10 16 11 12
9 98 53 75 17 48 74 33 32 52 71 18 33 1 57 18
`,
stripIndents`27
6 6
6 3 4 2 5 1
78 63 54 67 43 46
`,
stripIndents`28
28 225
10 7 26 18 15 12 9 21 4 13 3 17 28 1 20 2 11 14 19 16 24 23 5 22 6 8 25 27
66 76 71 68 20 77 6 13 24 43 63 7 27 21 22 50 89 63 59 2 79 87 8 23 17 68 21 14
`,
stripIndents`29
26 64
22 20 9 25 12 21 18 13 15 8 3 5 17 1 26 19 6 11 2 4 14 23 24 10 16 7
47 92 32 73 7 99 45 80 34 17 64 36 65 21 74 35 86 45 63 73 45 62 78 25 44 76
`,
stripIndents`30
24 5
21 23 12 2 13 22 3 20 24 18 5 16 10 8 11 14 1 17 6 9 19 15 7 4
96 67 75 94 6 12 31 9 90 25 80 33 70 8 36 2 1 92 89 38 18 39 30 98
`,
stripIndents`31
19 3
15 4 11 1 12 8 14 9 16 3 17 13 2 19 6 18 7 5 10
92 75 22 48 90 26 100 30 52 22 15 77 31 85 93 70 60 71 79
`,
stripIndents`32
6 3
1 6 3 4 2 5
24 77 76 58 91 44
`,
stripIndents`33
13 8
12 3 9 13 11 7 10 8 2 1 5 4 6
6 86 19 69 6 99 81 15 26 14 24 39 7
`,
stripIndents`34
8 10
6 5 1 3 4 2 8 7
24 41 95 96 96 64 51 87
`,
stripIndents`35
27 13
8 17 12 21 6 1 4 7 13 16 19 5 20 22 3 25 14 24 18 10 15 2 9 27 23 26 11
33 4 4 33 66 44 83 85 78 20 43 68 88 20 38 84 52 37 25 29 77 96 96 56 19 13 37
`,
stripIndents`36
19 5
16 3 8 4 11 18 9 2 14 19 12 6 15 13 10 5 7 17 1
3 74 52 13 64 81 79 75 54 6 14 1 25 93 80 28 30 6 30
`,
stripIndents`37
30 3
27 20 6 14 13 10 7 22 8 3 17 19 30 18 11 5 2 24 9 26 29 28 15 25 23 21 12 4 16 1
84 11 68 90 60 83 75 64 91 20 29 6 82 69 86 57 72 97 64 37 58 17 32 99 49 3 16 26 92 49
`,
stripIndents`38
24 83
10 21 22 15 2 17 1 7 6 24 20 16 4 23 18 19 3 12 8 9 14 11 5 13
34 87 13 85 30 72 50 99 11 30 14 74 40 19 33 99 83 23 56 64 41 64 4 89
`,
stripIndents`39
9 11
3 9 6 2 1 7 5 4 8
100 32 7 13 99 72 22 86 18
`,
stripIndents`40
18 78
18 15 1 2 8 4 12 11 10 16 13 17 9 6 7 5 14 3
23 25 72 56 62 39 48 18 9 82 33 51 54 30 64 83 29 1
`,
stripIndents`41
17 3
14 10 9 1 7 13 11 12 8 15 17 16 5 3 6 4 2
53 43 69 86 50 40 20 11 93 75 91 72 44 100 27 48 10
`,
stripIndents`42
18 22
14 8 12 13 2 6 7 16 3 15 9 10 11 4 1 18 17 5
79 97 30 62 3 17 94 26 1 48 17 47 57 93 83 87 12 18
`,
stripIndents`43
15 3
4 12 8 13 9 3 6 2 11 1 15 5 7 14 10
48 87 22 17 93 47 18 4 33 20 65 80 67 100 37
`,
stripIndents`44
9 3
4 5 9 1 6 3 7 2 8
84 17 4 20 31 75 79 76 93
`,
stripIndents`45
28 246
26 22 14 18 12 24 16 11 25 10 4 13 21 5 6 23 15 17 27 1 28 9 19 3 20 8 7 2
36 85 85 41 87 3 46 77 50 18 74 97 67 89 80 91 99 11 57 31 98 66 47 97 38 25 40 42
`,
stripIndents`46
15 40
12 8 7 13 1 2 5 9 10 6 15 14 4 11 3
65 9 57 71 94 95 10 69 3 20 20 13 89 80 43
`,
stripIndents`47
5 5
2 3 4 1 5
16 9 56 2 75
`,
stripIndents`48
5 11
4 5 3 1 2
3 8 29 9 96
`,
stripIndents`49
8 3
1 3 6 7 4 5 2 8
78 43 62 29 58 18 95 87
`,
stripIndents`50
8 3
8 2 3 5 4 6 1 7
60 14 90 47 33 31 54 79
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