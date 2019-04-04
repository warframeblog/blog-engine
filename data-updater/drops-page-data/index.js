const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash');

const load = async() => {
	try {
		const {data} = await axios.get(process.env.DROPS_URL);
		return cheerio.load(data);
	} catch(e) {
		console.log(`Cannot load drops page ${e}`);
	}
}

const getMissionRewards = ($, missionName) => {
	const $missionRewardsTableBody = $('#missionRewards').next().find('tbody');
	return getMissionRewardsByRotation($, missionName, $missionRewardsTableBody);
}

const getSpecialMissionRewards = ($, specialMissionName) => {
	const $rewardsTableBody = $(`#transientRewards`).next().find('tbody');
	return getMissionRewardsByRotation($, specialMissionName, $rewardsTableBody);
}

const getMissionRewardsByRotation = ($, missionName, $rewardsTableBody) => {
	let rewardsByRotation = [];
	let rotation;
	let index;
	$rewardsTableBody.find(`:contains('${missionName}')`)
		.nextUntil('tr.blank-row').each(function() {
			const $el = $(this);
			const thText = $el.text();
			if($el.children("th").length && /Rotation [ABC]+/.test(thText)) {
				rotation = thText.replace( /\s/g, '');
				index = 0;
			} else if($el.children("td").length) {
				const itemName = $el.find('td:first-child').text();
				const probability = $el.find('td:nth-child(2)').text();

				if(!rewardsByRotation[index]) {
					rewardsByRotation[index] = {};
				}
				rewardsByRotation[index][rotation] = `${itemName} ${probability}`;
				index++;
			}

	});
	return rewardsByRotation;
}

const RELIC_NAME_REGEX = /((Lith|Meso|Neo|Axi)\s\w\d+)/;
const getItemPartsToAllRelics = ($, primedItem) => {
	const $relicRewardsTableBody = $('#relicRewards').next().find('tbody');
	let itemPartsToRelics = {};
	let currentRelic = '';
	$relicRewardsTableBody.find('tr:not(.blank-row)').each(function() {
		const $el = $(this)
		if($el.children('th').length) {
			currentRelic = formatRelicName($el.text());
		} else if($el.children('td').length) {
			const itemName = $el.find('td:first-child').text();
			if(!itemName.includes(primedItem)) {
				return;
			}

			if(!itemPartsToRelics[itemName]) {
				itemPartsToRelics[itemName] = [];
			}

			if(!itemPartsToRelics[itemName].includes(currentRelic)) {
				itemPartsToRelics[itemName].push(currentRelic);
			}
		}
	});
	return itemPartsToRelics;
}

const formatRelicName = (relicName) => {
	if(RELIC_NAME_REGEX.test(relicName)) {
		return relicName.match(RELIC_NAME_REGEX)[1];
	} else {
		throw new Error(`Cannot format relic with name ${relicName}`);
	}
}

const getItemPartsToAvailableRelics = ($, primedItem) => {
	const itemPartsToAllRelics = getItemPartsToAllRelics($, primedItem);
	const availableRelics = getAvailableRelics($);

	let itemPartsToAvailableRelics = {};
	_.each(itemPartsToAllRelics, (allRelics, itemPart) => {
		itemPartsToAvailableRelics[itemPart] = allRelics.filter(relic => availableRelics.includes(relic));
	});
	return itemPartsToAvailableRelics;
}

const getAvailableRelics = ($) => {
	const $missionRewardsTableBody = $('#missionRewards').next().find('tbody');
	let availableRelics = [];
	$missionRewardsTableBody.find('tr:not(.blank-row)').each(function() {
		const $el = $(this);
		if($el.children("td").length) {
			const tdFirstChild = $el.find('td:first-child').text();
			if(tdFirstChild.includes('Relic')) {
				const relicName = formatRelicName(tdFirstChild);
				if(!availableRelics.includes(relicName)) {
					availableRelics.push(relicName);
				}
			}
		}});

	return availableRelics;
}

const getRelicEras = (relics) => {
	return relics.map(relic => {
		return relic.match(RELIC_NAME_REGEX)[2];
	});
}

const groupRelicsByEras = (relics) => {
	let result = {};
	relics.forEach(relic => {
		const relicEra = relic.match(RELIC_NAME_REGEX)[2];
		if(!result[relicEra]) {
			result[relicEra] = [];		
		}
		result[relicEra].push(relic);		
	});
	return result;
}

module.exports = {
	load,
	getMissionRewards,
	getSpecialMissionRewards,
	getItemPartsToAllRelics,
	getItemPartsToAvailableRelics,
	getRelicEras,
	groupRelicsByEras
}