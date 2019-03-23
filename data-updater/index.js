const CronJob = require('cron').CronJob;
const Queue = require('queue');

const git = require('@git-integration');
const updateEvents = require('@update-events');
const updateRewardsDrop = require('@update-rewards-drop');

const queue = new Queue({ concurrency: 1, autostart: true })
	.on('start', () => console.log(`Start refreshing data`))
	.on('success', (result) => {
		if(result) {
			console.log(`Data was successfully updated`);
		} else {
			console.log(`Data is up to date`);
		}
	})
	.on('error', (e) => console.log(e));

const dataUpdater = async() => {
	await git.cloneRepo();
	const cronJob = new CronJob('0 */1 * * * *', 
		() => queue.push(updateDataJob));
	cronJob.start();
}

const updateDataJob = async() => {
	await git.resetRepoState();

	const updateResult = await updateData();
	
	if(updateResult && updateResult.some(part => part === true)) {
		await git.changeRepoState();
		return true;		
	} else {
		return false;
	}
}

const updateData = async() => {
	const dataToRefresh = [
		updateEvents(),
		updateRewardsDrop(),
	];

	try {
		return await Promise.all(dataToRefresh);
	} catch(e) {
		console.log(`Cannot complete some of the updates ${e}`);
		await git.resetRepoState();
		throw e;
	}
}

module.exports = dataUpdater;