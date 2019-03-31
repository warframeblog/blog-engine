const join = require('path').join;

const pug = require('pug');
const matter = require('gray-matter');

const dropsPageData = require('@drops-page-data');

const compiledFunction = pug.compileFile(join(__dirname, 'template.pug'));

const VAULTED = 'VAULTED';

const generateVaultedPrimePost = async() => {
	const {primedItem, alongWith} = {primedItem: 'Silva & Aegis', alongWith: ['Sybaris', 'Oberon']};

	let file = {};
	file.data = generateFrontMatter(primedItem, alongWith);

	const $ = await dropsPageData.load();

	const itemPartsToRelics = dropsPageData.getItemPartsToRelics($, primedItem);
	// console.log(itemPartsToRelics)
	file.content = compiledFunction({
		primedItem,
		alongWith,
		itemPartsToRelics
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
	frontMatter.state = VAULTED;
	frontMatter.image = `/images/primes/warframe-how-to-get-vaulted-${normalizedPrimedItem}-prime.jpg`;
	frontMatter.alongWith = alongWith;
	return frontMatter;
}

module.exports = generateVaultedPrimePost;