const join = require('path').join;

const updateIfChanged = require('@update-if-changed');
const dropsPageData = require('@drops-page-data'); 
const updatePostDate = require('@update-post-date');

const PATH_TO_ONSLAUGHT_FOLDER = join(__basedir, process.env.REPO_FOLDER, 
	process.env.DATA_FOLDER, process.env.ONSLAUGHT_FOLDER);

const updateSanctuaryOnslaught = async($) => {
	const pathToPreviousData = [process.env.NORMAL_ONSLAUGHT_FILENAME, process.env.ELITE_ONSLAUGHT_FILENAME]
		.map(filename => join(PATH_TO_ONSLAUGHT_FOLDER, filename));

	const normalOnslaughtData = dropsPageData.getDropsByMissionName($, process.env.NORMAL_ONSLAUGHT_MISSION_NAME);
	const eliteOnslaughtData = dropsPageData.getDropsByMissionName($, process.env.ELITE_ONSLAUGHT_MISSION_NAME);
	const currentData = [normalOnslaughtData, eliteOnslaughtData];

	const changed = await updateIfChanged(pathToPreviousData, currentData);

	if(changed) {
		const pathToOnslaughtPost = join(__basedir, process.env.REPO_FOLDER, 
			process.env.CONTENT_FOLDER, process.env.ONSLAUGHT_POST);
		await updatePostDate(pathToOnslaughtPost);
	}

	return changed;
}

module.exports = async() => {
	const $ = await dropsPageData.load();
	return await updateSanctuaryOnslaught($);
}