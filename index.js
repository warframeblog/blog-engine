global.__basedir = __dirname;

const registerCustomModules = require('module-alias/register')
const configEnv = require('dotenv').config();
const express = require('express');

const dataUpdater = require('@data-updater');

dataUpdater();

if(process.env.NODE_ENV === 'production') {
	const app = express();
	app.get('/', (req, res) => res.send('Hello World!'));
	app.listen(process.env.PORT, () => console.log(`App listening on port ${process.env.PORT}!`));
}