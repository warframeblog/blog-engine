const CronJob = require('cron').CronJob;
const Queue = require('queue');

const git = require('@git-integration');
// const updateEvents = require('@update-events');
const updateRewardsDrop = require('@update-rewards-drop');

const refreshData = async() => {
	await git.resetRepoState();
	let result;
	try {
		result = await Promise.all([updateRewardsDrop()]);
	} catch(e) {
		console.log(`Cannot complete some of the updates ${e}`);
		await git.resetRepoState();
	}
	if(result && result.some(r => r === true)) {
		await git.changeRepoState();		
	}
}

const queue = new Queue({ concurrency: 1, autostart: true })
	.on('start', () => console.log('start'))
	.on('success', () => console.log('success'))
	.on('error', (e) => console.log(e));

const dataRefresher = async() => {
	await git.cloneRepo();
	const cronJob = new CronJob('0 */1 * * * *', 
		() => queue.push(refreshData));
	cronJob.start();
}

module.exports = dataRefresher;