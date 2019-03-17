const CronJob = require('cron').CronJob;
const Queue = require('queue');

const git = require('@git-integration');
const updateEvents = require('@update-events');

const refreshData = async() => {
	await git.resetRepoState();
	const result = await updateEvents();
	if(result) {
		await git.changeRepoState();		
	}
}

const queue = new Queue({ concurrency: 1, autostart: true })
	.on('start', () => console.log('start'))
	.on('success', () => console.log('success'))
	.on('error', (e) => console.log(e));

module.exports = new CronJob('0 */1 * * * *', function() {
	queue.push(refreshData);
});