const join = require('path').join;

const pug = require('pug');
const matter = require('gray-matter');
const _ = require('lodash');
const converter = require('number-to-words');

const dropsPageData = require('@drops-page-data');

const compiledFunction = pug.compileFile(join(__dirname, 'template.pug'));

const NEW = 'NEW';

const generateNewPrimePost = async() => {
	const {primedItem, alongWith} = {primedItem: 'Tiberon', alongWith: ['Zephyr', 'Kronen']};

	let file = {};
	file.data = generateFrontMatter(primedItem, alongWith);

	const $ = await dropsPageData.load();

	const itemPartsToRelics = dropsPageData.getItemPartsToAvailableRelics($, primedItem);
	const allRelics = Object.values(itemPartsToRelics).join(',');
	const numberOfRelics = converter.toWords(allRelics.split(',').length);
	const unitedItemPartsByRelicEras = unionItemPartsByRelicEras(itemPartsToRelics);
	// console.log(JSON.stringify(unitedItemPartsByRelicEras))
	file.content = compiledFunction({
		primedItem,
		alongWith,
		numberOfRelics,
		itemPartsToRelics,
		unitedItemPartsByRelicEras
	});

	const result = matter.stringify(file);

	console.log(result)

}

const generateFrontMatter = (primedItem, alongWith) => {
	let frontMatter = {};
	const normalizedPrimedItem = primedItem.toLowerCase()
		.replace(/&/g, '-and-')
		.replace(/\s/g, '');
	frontMatter.title = `How To Get ${primedItem} Prime`;
	frontMatter.seoTitle = `How To Get ${primedItem} Prime. How To Farm ${primedItem} Prime Relics`;
	frontMatter.date = new Date();
	frontMatter.author = 'warframe';
	frontMatter.layout = 'post';
	frontMatter.permalink = `/primes/how-to-get-${normalizedPrimedItem}-prime/`;
	frontMatter.categories = ['Primes'];
	frontMatter.generated = true;
	frontMatter.primedItem = primedItem;
	frontMatter.state = NEW;
	frontMatter.image = `/images/primes/warframe-how-to-get-${normalizedPrimedItem}-prime.jpg`;
	frontMatter.alongWith = alongWith;
	return frontMatter;
}

const unionItemPartsByRelicEras = (itemPartsToRelics) => {
	let result = [];
	let extractedParts = [];

	_.each(itemPartsToRelics, (relicsOfCurrentItemPart, currentItemPart) => {
		if(extractedParts.includes(currentItemPart)) {
			return;
		}
		const relicErasOfCurrentItemPart = dropsPageData.getRelicEras(relicsOfCurrentItemPart);

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

			const relicEras = dropsPageData.getRelicEras(relics);
			const sameEras = relicEras.filter(era => relicErasOfCurrentItemPart.includes(era));
			if(sameEras.length === relicErasOfCurrentItemPart.length) {
				iterationResult.parts.push(itemPart);
				iterationResult.eras = [...sameEras];
				allRelics.push(...relics);
				extractedParts.push(itemPart);
			}
		});

		iterationResult.relics = dropsPageData.groupRelicsByEras(allRelics);

		if(!iterationResult.eras) {
			iterationResult.eras = [...relicErasOfCurrentItemPart];
		}
		result.push(iterationResult);
	});

	return _.orderBy(result, function(o) { return o.parts.length; }, ['desc']);;
}

module.exports = generateNewPrimePost;