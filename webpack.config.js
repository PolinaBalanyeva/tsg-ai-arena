import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const webpack = require('webpack');
const path = require('path');

const __dirname = new URL(import.meta.url).pathname.split('/').slice(0,-1).join('/')
console.log(__dirname)

const webpackConfigGenerator = (env, argv = {}) => {
	const browsers = [
		'last 2 chrome versions',
		...(argv.mode === 'production'
			? ['last 2 firefox versions', 'safari >= 9', 'last 2 edge versions']
			: []),
	];

	const envConfig = {
		targets: {
			browsers,
		},
		useBuiltIns: 'entry',
		shippedProposals: true,
		debug: true,
	};

	return {
		entry: Object.assign(
			...[
				'test',
				'dragon-ball',
				'mayfes2018-day2',
				'dragon-puzzles',
				'komabasai2018-ai',
				'komabasai2018-procon',
				'mayfes2019-procon',
				'komabasai2019-marathon',
				'mayfes2020-marathon',
				'mayfes2021-marathon',
				'mayfes2022-marathon',
			].map((name) => ({
				[`contest-${name}`]: [
					...(argv.mode === 'development'
						? ['webpack-hot-middleware/client?reload=true']
						: []),
					path.join(__dirname, 'public', `js/contests/${name}/index.babel.js`),
				],
			}))
		),
		mode: argv.mode || 'development',
		output: {
			publicPath: '/js',
			filename: '[name].js',
		},
		devtool:
			argv.mode === 'production'
				? 'source-map'
				: 'eval-cheap-module-source-map',
		module: {
			rules: [
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: [
								['@babel/preset-env', envConfig],
								'@babel/preset-react',
							],
							plugins: [
								'@babel/plugin-proposal-class-properties',
								'@babel/plugin-proposal-object-rest-spread',
							],
						},
					},
				},
				{
					test: /\.s?css$/,
					use: ['style-loader', 'css-loader', 'sass-loader'],
				},
			],
		},
		resolve: {
			fallback:{
				fs: 'empty',
				net: 'empty',
				tls: 'empty',
			}
		},
		plugins: [
			new webpack.HotModuleReplacementPlugin(),
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(argv.mode),
			}),
		],
	};
};

export default webpackConfigGenerator