const CronJob = require('cron').CronJob;
const Queue = require('queue');

const git = require('./git-integration');
const tasks = require('./tasks');

module.exports = async() => {
	if(!git.isRepoClonedSync()) {
		await git.cloneRepo();
	}


	if(process.env.NODE_ENV === 'production') {
		const queue = new Queue({ concurrency: 1, autostart: true })
			.on('start', () => console.log(`Check for data updates`))
			.on('success', (result) => {
				if(result) {
					console.log(`Data was successfully updated`);
				} else {
					console.log(`Data is up to date`);
				}
			})
			.on('error', (e) => console.log(e));
		const cronJob = new CronJob('0 */1 * * * *', () => queue.push(performTasks));
		cronJob.start();
	} else {
		await performTasks();
	}
}

const performTasks = async() => {
	await git.resetRepoState();

	let result;
	try {
		result = await Promise.all(tasks);
	} catch(e) {
		console.log(`Cannot complete some task: ${e}`);
		await git.resetRepoState();
		throw e;
	}

	if(result && result.some(anyChange => anyChange === true)) {
		await git.changeRepoState();
		return true;		
	} else {
		return false;
	}
}