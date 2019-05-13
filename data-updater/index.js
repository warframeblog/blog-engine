const CronJob = require('cron').CronJob;
const Queue = require('queue');

const git = require('@git-integration');
const tasks = require('./tasks');


module.exports = async () => {
	const repoData = {
		name: 'warframeblog',
		branch: 'develop',
		url: process.env.WARFRAMEBLOG_REPO
	}
	const wrappedPeformTasks = await git.transactionWrapper(repoData, performTasks);


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
		const cronJob = new CronJob('0 */1 * * * *', () => queue.push(wrappedPeformTasks));
		cronJob.start();
	} else {
		await wrappedPeformTasks();
	}
}

const performTasks = async (context) => {
	return Promise.all(tasks.map(task => task.call(null, context)));
}