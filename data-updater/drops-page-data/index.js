const axios = require('axios');
const cheerio = require('cheerio');


const load = async() => {
	try {
		const {data} = await axios.get(process.env.DROPS_URL);
		return cheerio.load(data);
	} catch(e) {
		console.log(`Cannot load drops page ${e}`);
	}
}

const getDropsByMissionName = ($, missionName) => {
	const $missionRewardsTableBody = $('#missionRewards').next().find('tbody');
	let drops = [];
	let rotation;
	let index;
	$missionRewardsTableBody.find(`:contains('${missionName}')`)
		.nextUntil('tr.blank-row').each(function() {
			const $el = $(this);
			const thText = $el.text();
			if($el.children("th").length && /Rotation [ABC]+/.test(thText)) {
				rotation = thText;
				index = 0;
			} else if($el.children("td").length) {
				const itemName = $el.find('td:first-child').text();
				const probability = $el.find('td:nth-child(2)').text();

				if(!drops[index]) {
					drops[index] = {};
				}
				drops[index][rotation] = `${itemName} ${probability}`;
				index++;
			}

	});
	return drops;
}

module.exports = {
	load,
	getDropsByMissionName
}