const join = require('path').join;
const url = require('url');

const axios = require('axios');
const _ = require('lodash');

const platforms = require('@platforms');
const updateIfChanged = require('@update-if-changed');

const EVENTS_FOLDER_PATH = join(__basedir, process.env.REPO_FOLDER,
	process.env.DATA_FOLDER, process.env.EVENTS_FOLDER);
const JSON_EXT = '.json';

const updateEvents = async() => {
	const pathToPreviousEvents = platforms
		.map(platform => join(EVENTS_FOLDER_PATH, platform + JSON_EXT));
	const currentEvents = await getCurrentEvents();

	const changed = await updateIfChanged(pathToPreviousEvents, currentEvents);

	if(changed) {
		console.log(`Events updated`);
		await updateRelatedEventsPosts();
	}

	return changed;
}

const getCurrentEvents = async() => {
	const eventsContents = await fetchEventsContents();

	return eventsContents
		.map(content => content.data)
		.map(omitDynamicEventsParameters);
}


const fetchEventsContents = async() => {
	const platformEventsToFetch = platforms
		.map(platform => `${process.env.WORDSTAT_API_URL}${platform}/${process.env.EVENTS_FOLDER}/`)
		.map(url => axios.get(url));

	try {
		return await Promise.all(platformEventsToFetch);
	} catch(e) {
		console.log(`Cannot fetch all urls related to events ${e}`);
		throw e;
	}
}

const omitDynamicEventsParameters = (events) => {
	const parametersToOmit = ['startString', 'active', 'expired', 
		'health', 'currentScore', 'interimSteps', 'progressSteps',
		'asString'
	];
	return events.map(event => _.omit(event, parametersToOmit));
}

const updateRelatedEventsPosts = async(newEvents) => {
	console.log('Update related post date');

}

module.exports = updateEvents;