const join = require('path').join;

const pug = require('pug');
const matter = require('gray-matter');
const _ = require('lodash');
const converter = require('number-to-words');

const dropsPageData = require('@drops-page-data');

const compiledFunction = pug.compileFile(join(__dirname, 'template.pug'));

const UNVAULTED = 'UNVAULTED';

module.exports = async({primedItem, alongWith}) => {
	let file = {};
	file.data = generateFrontMatter(primedItem, alongWith);

	const $ = await dropsPageData.load();

	const itemPartsToRelics = dropsPageData.getItemPartsToAvailableRelics($, primedItem);
	console.log(JSON.stringify(itemPartsToRelics))
	const allRelics = Object.values(itemPartsToRelics).join(',');
	const numberOfRelics = converter.toWords(allRelics.split(',').length);
	const unitedItemPartsByRelicEras = dropsPageData.unionItemPartsByRelicEras(itemPartsToRelics);
	file.content = compiledFunction({
		primedItem,
		alongWith,
		numberOfRelics,
		itemPartsToRelics,
		unitedItemPartsByRelicEras
	});

	// console.log(result)
	return matter.stringify(file);
}

const generateFrontMatter = (primedItem, alongWith) => {
	let frontMatter = {};
	const normalizedPrimedItem = primedItem.toLowerCase()
		.replace(/&/g, '-and-')
		.replace(/\s/g, '');
	frontMatter.title = `How To Get ${primedItem} Prime`;
	frontMatter.seoTitle = `How To Get ${primedItem} Prime. How To Farm ${primedItem} Prime Relics? ${primedItem} Prime Unvaulted!`;
	frontMatter.date = new Date();
	frontMatter.author = 'warframe';
	frontMatter.layout = 'post';
	frontMatter.permalink = `/primes/how-to-get-${normalizedPrimedItem}-prime/`;
	frontMatter.categories = ['Primes'];
	frontMatter.generated = true;
	frontMatter.primedItem = primedItem;
	frontMatter.state = UNVAULTED;
	frontMatter.image = `/images/primes/warframe-how-to-get-${normalizedPrimedItem}-prime.jpg`;
	frontMatter.alongWith = alongWith;
	return frontMatter;
}

