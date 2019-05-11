const express = require('express');
const bodyParser= require('body-parser');

const imageRouter = require('./images');

module.exports = () => {
	const app = express();
	app.use(bodyParser.urlencoded({extended: true}));

	app.use('/images', imageRouter)
	app.get('/', (req, res) => res.send('Hello World!'));
	app.listen(process.env.PORT, () => console.log(`App listening on port ${process.env.PORT}!`));
}