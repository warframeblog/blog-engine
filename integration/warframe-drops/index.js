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

const MISSION_REWARDS_ID = '#missionRewards';
const ROTATION_REGEX = /Rotation [ABC]+/;

const getMissionRewards = ($, missionName) => {
	const $missionRewardsTableBody = $(MISSION_REWARDS_ID).next().find('tbody');
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
			if($el.children("th").length && ROTATION_REGEX.test(thText)) {
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

const getRewardsByMission = ($, missionName) => {
	const $missionRewardsTableBody = $(MISSION_REWARDS_ID).next().find('tbody');
	let mission = '';
	let availableRelics = [];
	$missionRewardsTableBody.find('tr').each(function() {
		const $el = $(this);
		if($el.hasClass('.blank-row')){
			
		} else if($el.children("td").length) {
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

const getDropLocationsByResource = ($, resource) => {
	const $missionRewardsTableBody = $(MISSION_REWARDS_ID).next().find('tbody');
	let dropLocations = [];
	let mission;
	let rotation;
	$missionRewardsTableBody.find('tr:not(.blank-row)').each(function() {
			const $el = $(this);
			const thText = $el.text();
			if($el.children("th").length && ROTATION_REGEX.test(thText)) {
				rotation = thText;
			} else if($el.children("th").length) {
				mission = thText;
			} else if($el.children("td").length) {
				const itemName = $el.find('td:first-child').text();
				const probability = $el.find('td:nth-child(2)').text();

				if(itemName.includes(resource)) {
					dropLocations.push({mission, rotation, probability});
				}
			}
		});

	return dropLocations;
}

const unionItemPartsByRelicEras = (itemPartsToRelics) => {
	let result = [];
	let extractedParts = [];
	_.each(itemPartsToRelics, (relicsOfCurrentItemPart, currentItemPart) => {
		if(extractedParts.includes(currentItemPart)) {
			return;
		}
		const relicErasOfCurrentItemPart = getRelicEras(relicsOfCurrentItemPart);

		let iterationResult = {
			parts: []
		};
		let allRelics = [...relicsOfCurrentItemPart];

		iterationResult.parts.push(currentItemPart);
		extractedParts.push(currentItemPart);

		_.each(itemPartsToRelics, (relics, itemPart) => {
			if(extractedParts.includes(itemPart)) {
				return;
			}

			const relicEras = getRelicEras(relics);
			const sameEras = relicEras.filter(era => relicErasOfCurrentItemPart.includes(era));
			if(sameEras.length === relicErasOfCurrentItemPart.length) {
				iterationResult.parts.push(itemPart);
				iterationResult.eras = [...sameEras];
				allRelics.push(...relics);
				extractedParts.push(itemPart);
			}
		});

		iterationResult.relics = groupRelicsByEras(allRelics);
		iterationResult.formattedParts = formatItemParts(iterationResult.parts);

		if(!iterationResult.eras) {
			iterationResult.eras = [...relicErasOfCurrentItemPart];
		}
		result.push(iterationResult);
	});

	return _.orderBy(result, function(o) { return o.parts.length; }, ['desc']);;
}

const formatItemParts = (itemParts) => {
	return itemParts.map(itemPart => {
		if(/.+\sPrime\s(Blueprint|Systems|Chassis|Neuroptics)/.test(itemPart)) {
			return itemPart.match(/.+\sPrime\s(Blueprint|Systems|Chassis|Neuroptics)/)[0];
		} else {
			return itemPart;
		}
	}).map((itemPart, index) => {
		if(index === 0) {
			return itemPart;
		} else {
			const lastIndex = itemPart.lastIndexOf(' ');
			return itemPart.substring(lastIndex, itemPart.length).trim();
		}
	});
}

const findCetusBountiesRelicsByTiers = ($) => {
	return findBountiesRelicsByTiers($, '#cetusRewards', 'th:contains("Ghoul")');
}

const findSolarisBountiesRelicsByTiers = ($) => {
	return findBountiesRelicsByTiers($, '#solarisRewards', 'th:contains("PROFIT-TAKER")');
}

const findBountiesRelicsByTiers = ($, id, selectorToSkip) => {
	const $rewardsTableBody = $(id).next().find('tbody');
	let tier = 1;
	let bountiesRelicsByTiers = [];
	$rewardsTableBody.find('tr').each(function() {
		const $el = $(this);
		if($el.hasClass('blank-row')) {
			++tier;
		} else if($el.find(selectorToSkip).length) {
			return false;
		} else if($el.children("td").length) {
			const item = $el.find('td:nth-child(2)').text();
			if(!item.includes('Relic')) {
				return true;
			}
			const relicName = formatRelicName(item);
			if(!bountiesRelicsByTiers.some(relic => relic.name === relicName && relic.tier === tier)) {
				bountiesRelicsByTiers.push({name: relicName, tier});
			}
		}
	});
	return bountiesRelicsByTiers;
}

module.exports = {
	load,
	getMissionRewards,
	getSpecialMissionRewards,
	getItemPartsToAllRelics,
	getItemPartsToAvailableRelics,
	getRelicEras,
	groupRelicsByEras,
	getDropLocationsByResource,
	unionItemPartsByRelicEras,
	findCetusBountiesRelicsByTiers,
	findSolarisBountiesRelicsByTiers
}