const join = require('path').join;

const _ = require('lodash');

const content = require('@content');
const warframestat = require('@warframestat');

module.exports = async (context) => {
	const post = {
		file: "balor-fomorian-event.md",
		repo: context.repoData.name
	};

	const postContent = await content.getPostContent(post);
	const postEventData = postContent.data.eventData;
	const presentlyRelevantEventData = await warframestat.getEventData(warframestat.events.FOMORIAN);

	console.log(presentlyRelevantEventData)
	if(_.xorWith(postEventData, presentlyRelevantEventData, _.isEqual).length === 0) {
		return false;
	} else if(!(presentlyRelevantEventData.length === 0 && postEventData.length > 0)) {
		postContent.data.date = new Date();
	}

	postContent.data.eventData = presentlyRelevantEventData;
	await content.writeNewContent(post, postContent);
	return true;
}