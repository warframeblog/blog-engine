const axios = require('axios');

const platformIds = require('./platforms').ids;
const platformNames = require('./platforms').names;

const events = {
	FOMORIAN: 'Balor Fomorian'
}

const getEventData = async (eventName) => {
	const eventsByPlatforms = await fetchEvents();
	const eventData = eventsByPlatforms.map((eventsByPlatform, index) => {
		const event = eventsByPlatform.find(event => event.description.includes(eventName));
		if(event) {
			return { platform: platformNames[index], place: event.victimNode };
		} else {
			return {};
		}
	}).filter(platformEvent => Object.keys(platformEvent).length !== 0);
	return eventData;
}

const fetchEvents = async () => {
	const eventsByPlatformsToFetch = platformIds
		.map(platform => `${process.env.WORDSTAT_API_URL}/${platform}/events`)
		.map(url => axios.get(url));

	try {
		const responces = await Promise.all(eventsByPlatformsToFetch);
		return responces.map(resp => resp.data);
	} catch(e) {
		console.log(`Cannot fetch events ${e}`);
		throw e;
	}
}

module.exports = {
	getEventData,
	events
}