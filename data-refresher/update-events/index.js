const fs = require('fs').promises;
const join = require('path').join;
const url = require('url');

const axios = require('axios');
const _ = require('lodash');

const platforms = require('@platforms');

const EVENTS_FOLDER_PATH = join(process.env.DATA_FOLDER_PATH, process.env.EVENTS_FOLDER);
const JSON_EXT = '.json';

const updateEvents = async() => {
	const newEvents = await distinguishNewEventsByPlatform();

	if(newEvents.length === 0) {
		console.log(`State of the events isn't changed`)
		return false;
	}

	await updateEventsDataFiles(newEvents);
	await updateRelatedEventsPosts(newEvents);

	return true;
}

const distinguishNewEventsByPlatform = async() => {
	const previousEvents = await getPreviousEvents();
	const currentEvents = await getCurrentEvents();

	return currentEvents.map((events, index) => {
		if(_.isEqual(events, previousEvents[index])) {
			return {events: [], platform: platforms[index]};
		} else {
			return {events, platform: platforms[index]};
		}
	}).filter(eventsForPlatform => eventsForPlatform.events.length > 0);
}

const getPreviousEvents = async() => {
	const eventsFileContents = await getEventsFileContents();
	return eventsFileContents.map(buf => buf.toString()).map(jsonToObject);
}

const jsonToObject = (json) => {
	try {
		return JSON.parse(json);
	} catch(e) {
		console.log(`Cannot parse json: ${json}`)
	}
}

const getEventsFileContents = async() => {
	const eventsFileContentsToRead = platforms
		.map(platform => join(EVENTS_FOLDER_PATH, platform + JSON_EXT))
		.map(platformFolderPath => fs.readFile(platformFolderPath));

	try {
		return await Promise.all(eventsFileContentsToRead);
	} catch(e) {
		console.log(`Cannot read all files related to events ${e}`);
	}
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

const updateEventsDataFiles = async(newEvents) => {
	const newDataFilesContentsToSave = newEvents.map(eventsForPlatform => {
			const path = join(EVENTS_FOLDER_PATH, eventsForPlatform.platform + JSON_EXT);
			return fs.writeFile(path, JSON.stringify(eventsForPlatform.events));
		});

	try {
		return await Promise.all(newDataFilesContentsToSave);
	} catch(e) {
		console.log(`Cannot update contents of data files: ${e}`);
	}
}

module.exports = updateEvents;