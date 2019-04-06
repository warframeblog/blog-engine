const join = require('path').join;

const updateIfChanged = require('@update-if-changed');
const dropsPageData = require('@drops-page-data');
const updatePostDate = require('@update-post-date');

const PATH_TO_ONSLAUGHT_FOLDER = join(__basedir, process.env.REPO_FOLDER, 
	process.env.DATA_FOLDER, process.env.ONSLAUGHT_FOLDER);

const updateSanctuaryOnslaught = async($) => {
	const pathToPreviousData = [process.env.NORMAL_ONSLAUGHT_FILENAME, process.env.ELITE_ONSLAUGHT_FILENAME]
		.map(filename => join(PATH_TO_ONSLAUGHT_FOLDER, filename));

	const normalOnslaughtData = dropsPageData.getMissionRewards($, process.env.NORMAL_ONSLAUGHT_MISSION_NAME);
	const eliteOnslaughtData = dropsPageData.getMissionRewards($, process.env.ELITE_ONSLAUGHT_MISSION_NAME);
	const currentData = [normalOnslaughtData, eliteOnslaughtData];

	const changed = await updateIfChanged(pathToPreviousData, currentData);

	if(changed) {
		const pathToOnslaughtPost = join(__basedir, process.env.REPO_FOLDER, 
			process.env.CONTENT_FOLDER, process.env.ONSLAUGHT_POST);
		await updatePostDate(pathToOnslaughtPost);
	}

	return changed;
}

const PATH_TO_REWARDS_FOLDER = join(__basedir, process.env.REPO_FOLDER, 
	process.env.DATA_FOLDER, process.env.REWARDS_FOLDER);
const updateArbitrations = async($) => {
	const pathToPreviousData = [process.env.ARBITRATIONS_FILENAME]
		.map(filename => join(PATH_TO_REWARDS_FOLDER, filename));
	const arbitrationsData = dropsPageData.getSpecialMissionRewards($, process.env.ARBITRATIONS_MISSION_NAME);
	const changed = await updateIfChanged(pathToPreviousData, [arbitrationsData]);

	return changed;
}

module.exports = async() => {
	const $ = await dropsPageData.load();
	const missionsToUpdate = [
		updateSanctuaryOnslaught($), 
		updateArbitrations($)
	];

	try {
		const result = await Promise.all(missionsToUpdate);
		return result.some(part => part === true);
	} catch(e) {
		console.log(`Cannot update some of mission\`s rewards: ${e}`);
		throw e;
	}
}