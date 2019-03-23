const updateIfChanged = require('@update-if-changed');
const dropsPageData = require('@drops-page-data'); 

const join = require('path').join;
const fs = require('fs').promises;

const updateSanctuaryOnslaught = async($) => {
	const pathToOnslaughtDataFolder = join(process.env.DATA_FOLDER_PATH, process.env.ONSLAUGHT_DROPS_FOLDER);
	const pathToPreviousData = [process.env.NORMAL_ONSLAUGHT_DROPS_FILENAME]
		.map(filename => join(pathToOnslaughtDataFolder, filename));

	const currentData = dropsPageData.getDropsByMissionName($, process.env.NORMAL_ONSLAUGHT_MISSION_NAME);
	const changed = await updateIfChanged(pathToPreviousData, [currentData]);

	if(changed) {
		console.log(`updateSanctuaryOnslaught will be performed`)
		//TODO update post publish date

	}

	return changed;
}

module.exports = async() => {
	const $ = await dropsPageData.load();
	return await updateSanctuaryOnslaught($);
}