const join = require('path').join;

const pug = require('pug');
const matter = require('gray-matter');
const _ = require('lodash');
const converter = require('number-to-words');

const dropsPageData = require('@drops-page-data');

const compiledFunction = pug.compileFile(join(__dirname, 'template.pug'));

module.exports = async($, postData) => {
	let file = {};
	file.data = generateFrontMatter(postData);

	const {primedItem, alongWith} = postData;
	const itemPartsToRelics = dropsPageData.getItemPartsToAvailableRelics($, `${primedItem} Prime`);
	const allRelics = Object.values(itemPartsToRelics).join(',');
	const numberOfRelics = converter.toWords(allRelics.split(',').length);
	const unitedItemPartsByRelicEras = dropsPageData.unionItemPartsByRelicEras(itemPartsToRelics);
	// console.log(allRelics)
	const cetutBountiesRelicsByTiers = dropsPageData.findCetusBountiesRelicsByTiers($);
	const solarisBountiesRelicsByTiers = dropsPageData.findSolarisBountiesRelicsByTiers($);
	// console.log(cetutBountiesRelicsByTiers)
	// console.log(solarisBountiesRelicsByTiers)

	const rewards = dropsPageData.getMissionRewards($, 'Void');
	// console.log(rewards)
	file.content = compiledFunction({
		primedItem,
		alongWith,
		numberOfRelics,
		itemPartsToRelics,
		unitedItemPartsByRelicEras,
		utils: {
			generateAlongWith
		}
	});

	// console.log(result)
	return matter.stringify(file);
}

const generateAlongWith = (alongWith) => {
	if (alongWith.length === 2) {
		return `along with the ${alongWith[0]} Prime and the ${alongWith[1]} Prime`;
	} else if (alongWith.length === 1) {
		return `and the ${alongWith[0]} Prime`;
	}
	return '';
}

const generateFrontMatter = (postData) => {
	const {primedItem, alongWith, normalizedPrimedItem, state} = postData;

	let frontMatter = {};
	frontMatter.title = `How To Get ${primedItem} Prime`;
	frontMatter.seoTitle = `How To Get ${primedItem} Prime. How To Farm ${primedItem} Prime Relics? ${primedItem} Prime Unvaulted!`;
	frontMatter.date = new Date();
	frontMatter.author = 'warframe';
	frontMatter.layout = 'post';
	frontMatter.permalink = `/primes/how-to-get-${normalizedPrimedItem}-prime/`;
	frontMatter.categories = ['Primes'];
	frontMatter.generated = true;
	frontMatter.primedItem = primedItem;
	frontMatter.state = state;
	frontMatter.image = `/images/primes/warframe-how-to-get-${normalizedPrimedItem}-prime.jpg`;
	frontMatter.alongWith = alongWith;
	return frontMatter;
}

