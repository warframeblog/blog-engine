global.__basedir = __dirname;

const registerCustomModules = require('module-alias/register')
const configEnv = require('dotenv').config();

const dataUpdater = require('@data-updater');
const webApp = require('./web-app');

if(process.env.NODE_ENV === 'production') {
	dataUpdater();
	webApp();
} else if(process.env.NODE_ENV === 'data-updater-dev') {
	dataUpdater();
} else if(process.env.NODE_ENV === 'web-app-dev') {
	webApp();
}