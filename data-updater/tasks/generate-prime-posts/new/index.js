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
	const itemPartsToRelics = dropsPageData.getItemPartsToAvailableRelics($, primedItem);
	const allRelics = Object.values(itemPartsToRelics).join(',');
	const numberOfRelics = converter.toWords(allRelics.split(',').length);
	const unitedItemPartsByRelicEras = dropsPageData.unionItemPartsByRelicEras(itemPartsToRelics);
	// console.log(JSON.stringify(unitedItemPartsByRelicEras))
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

const generateFrontMatter = (postData) => {
	const {primedItem, alongWith, normalizedPrimedItem, state} = postData;

	let frontMatter = {};
	frontMatter.title = `How To Get ${primedItem} Prime`;
	frontMatter.seoTitle = `How To Get ${primedItem} Prime. How To Farm ${primedItem} Prime Relics`;
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