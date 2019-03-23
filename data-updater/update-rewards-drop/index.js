const updateIfChanged = require('@update-if-changed');
const dropsPageData = require('@drops-page-data'); 

const join = require('path').join;
const fs = require('fs').promises;

const PATH_TO_ONSLAUGHT_FOLDER = join(__basedir, process.env.REPO_FOLDER, 
	process.env.DATA_FOLDER, process.env.ONSLAUGHT_FOLDER);

const updateSanctuaryOnslaught = async($) => {
	const pathToPreviousData = [process.env.NORMAL_ONSLAUGHT_FILENAME]
		.map(filename => join(PATH_TO_ONSLAUGHT_FOLDER, filename));

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