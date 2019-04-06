const updateEvents = require('./update-events');
const updateRewardsDrop = require('./update-rewards-drop');

module.exports = [
	updateEvents(),
	updateRewardsDrop()
];