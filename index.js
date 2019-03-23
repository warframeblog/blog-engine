const registerCustomModules = require('module-alias/register')
const configEnv = require('dotenv').config();

const dataRefresher = require('@data-refresher');

dataRefresher();