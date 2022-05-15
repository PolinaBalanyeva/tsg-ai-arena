/*
 * Module dependencies.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
const util = require('util');
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
import chalk from 'chalk';
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const MongoStore = require('connect-mongo');
const flash = require('express-flash');
const mongoose = require('mongoose');
const passport = require('passport');
const Router = require('express-promise-router');
const sass = require('node-sass-middleware');
const multer = require('multer');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const Agenda = require('agenda');

const __dirname = new URL(import.meta.url).pathname.split('/').slice(0,-1).join('/')

/*
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
import 'dotenv/config';

/*
 * Controllers (route handlers).
 */
import homeController from './controllers/home.js';
import userController from './controllers/user.js';
import submissionController from './controllers/submission.js';
import contestController from './controllers/contest.js';
import battleController from './controllers/battle.js';
import matchController from './controllers/match.js';
import turnController from './controllers/turn.js';

/*
 * Build-up Webpack compiler
 */
import webpackConfigGenerator from './webpack.config.js';
const webpackConfig = webpackConfigGenerator({}, {mode: process.env.NODE_ENV});
const compiler = webpack(webpackConfig);

/*
 * API keys and Passport configuration.
 */
import passportConfig from './config/passport.js';

const upload = multer();

/*
 * Create Express server.
 */
const app = express();
import io from './lib/socket-io.js';

/*
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connection.on('error', () => {
	throw new Error(
		`${chalk.red(
			'✗',
		)} MongoDB connection error. Please make sure MongoDB is running.`,
	);
});

/*
 * Initialize Agenda.
 */
const agenda = new Agenda({
	db: {
		address: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
		collection: 'agenda',
	},
	processEvery: '10 seconds',
});
import jobs from './lib/jobs.js';
agenda.define('dequeue-battles', jobs.dequeueBattles);
agenda.on('ready', () => {
	agenda.every('1 minute', 'dequeue-battles');
	agenda.start();
});

/*
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(compression());
app.use(
	sass({
		src: path.join(__dirname, 'public'),
		dest: path.join(__dirname, 'public'),
	}),
);
app.use(
	webpackDevMiddleware(compiler, {
		publicPath: webpackConfig.output.publicPath,
	}),
);
if (process.env.NODE_ENV === 'development') {
	app.use(webpackHotMiddleware(compiler));
}
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(upload.fields([{name: 'file', maxCount: 1}]));
app.use(
	session({
		resave: true,
		saveUninitialized: true,
		secret: process.env.SESSION_SECRET,
		store: MongoStore.create({
			mongoUrl: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
			autoReconnect: true,
		}),
	}),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
	lusca.csrf()(req, res, next);
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(async (req, res, next) => {
	const hash = await util
		.promisify(fs.readFile)(path.resolve(__dirname, '.git/refs/heads/master'))
		.catch(() => Math.floor(Math.random() * 1e10));

	res.locals.user = req.user;
	res.locals.hash = hash.toString().trim();
	res.locals.env = process.env.NODE_ENV;

	next();
});
app.use((req, res, next) => {
	// After successful login, redirect back to the intended page
	if (
		!req.user &&
		req.path !== '/login' &&
		req.path !== '/signup' &&
		!req.path.match(/^\/auth/) &&
		!req.path.match(/\./)
	) {
		req.session.returnTo = req.path;
	} else if (req.user && req.path === '/account') {
		req.session.returnTo = req.path;
	}
	next();
});
app.use(express.static(path.join(__dirname, 'public'), {maxAge: 31557600000}));

/*
 * Primary app routes.
 */
const router = Router();
router.get('/', homeController.index);
router.get('/login', userController.getLogin);
router.get('/logout', userController.logout);
router.get(
	'/account',
		passportConfig.isAuthenticated,
		userController.getAccount
);
router.get(
	'/contests/:contest',
		contestController.base,
		contestController.index
);
router.get(
	'/contests/:contest/submissions',
		contestController.base,
		submissionController.getSubmissions
	,
);
router.get(
	'/contests/:contest/submissions/:submission',
		contestController.base,
		submissionController.getSubmission
);
router.get(
	'/contests/:contest/battles',
		contestController.base,
		battleController.getBattles,
);
router.post(
	'/contests/:contest/battles',
	
		contestController.base,
		battleController.postBattle
);
router.get(
	'/contests/:contest/battles/:battle',
	
		contestController.base,
		battleController.getBattle
);
router.get(
	'/contests/:contest/battles/latest/visualizer',
	
	contestController.base,
	battleController.getLatestVisualizer
);
router.get(
	'/contests/:contest/battles/:battle/visualizer',
	contestController.base,
	battleController.getBattleVisualizer
);
router.get(
	'/contests/:contest/matches',
	contestController.base,
	matchController.getMatches,
);
router.get(
	'/contests/:contest/matches/:match',
	contestController.base,
	matchController.getMatch,
);
router.post(
	'/contests/:contest/matches',
	contestController.base,
	matchController.postMatch,
);
router.get(
	'/contests/:contest/turns/:turn',
	contestController.base,
	turnController.getTurn,
);
router.get(
	'/contests/:contest/admin',
	passportConfig.isAuthenticated,
	contestController.base,
	contestController.getAdmin,
);
router.post(
	'/contests/:contest',
	passportConfig.isAuthenticated,
	contestController.base,
	contestController.postContest,
);
router.post(
	'/contests/:contest/submissions',
	passportConfig.isAuthenticated,
	contestController.base,
		submissionController.postSubmission,
);

router.get('/submissions/:submission', submissionController.getOldSubmission);

/*
 * OAuth authentication routes. (Sign in)
 */
router.get('/auth/twitter', passport.authenticate('twitter'));
router.get(
	'/auth/twitter/callback',
	passport.authenticate('twitter', {failureRedirect: '/login'}),
	(req, res) => {
		res.redirect(req.session.returnTo || '/');
	},
);

app.use(router);

/*
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
	app.use(errorHandler());
}

/*
 * Start Express server.
 */
const server = app.listen(app.get('port'), () => {
	console.log(
		'%s App is running at http://localhost:%d in %s mode',
		chalk.green('✓'),
		app.get('port'),
		app.get('env'),
	);
	console.log('  Press CTRL-C to stop\n');
	});

io.attach(server);

export default app;
