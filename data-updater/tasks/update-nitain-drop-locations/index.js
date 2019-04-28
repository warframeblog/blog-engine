const join = require('path').join;

const updateIfChanged = require('@update-if-changed');
const dropsPageData = require('@drops-page-data');

const NITAIN_EXTRACT = 'Nitain Extract';
const PATH_TO_REWARDS_FOLDER = join(__basedir, process.env.REPO_FOLDER, 
	process.env.DATA_FOLDER, process.env.REWARDS_FOLDER);
module.exports = async() => {
	const $ = await dropsPageData.load();

	const pathToPreviousData = [process.env.NITAIN_FILENAME]
		.map(filename => join(PATH_TO_REWARDS_FOLDER, filename));
	const nitainDropLocations = dropsPageData.getDropLocationsByResource($, NITAIN_EXTRACT);
	const changed = await updateIfChanged(pathToPreviousData, [nitainDropLocations]);

	return changed;
}