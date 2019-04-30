
/*
Read json file with data - e.g.
[{item: 'Oberon', alongWith: ['Silva & Aegis', 'Sybaris']}]
Determine access - [Vaulted, Unvaulted, New]
Vaulted - previously has [unvaulted/new] access and their relics doesn't present as #missionRewards
Unvaulted - previously has [vaulted] access and has relics that are presented in #missionRewards
New - previously has [new] access and has relics that are presented in #missionRewards or doesn't exist in the first place
Generate frontMatter
Generate body based on access
Save to file
Feature - save to file only if file content considerably changed
*/
const fs = require('fs').promises;
const join = require('path').join;

const generateVaultedPrimePost = require('./vaulted');
const generateNewPrimePost = require('./new');
const generateUnvaultedPrimePost = require('./unvaulted');

const PRIME_POST_FOLDER = join(__basedir, process.env.REPO_FOLDER, 'content', 'primes')

module.exports = async() => {
	const postsToGenerate = [
		// {primedItem: 'Tipedo', alongWith: ['Equinox', 'Stradavar']},
		// {primedItem: 'Stradavar', alongWith: ['Tipedo', 'Equinox']},
		// {primedItem: 'Equinox', alongWith: ['Tipedo', 'Stradavar']},
		{primedItem: 'Volt', alongWith: ['Odonata'], access: 'UNVAULTED'},
	];

	for(let i = 0; i < postsToGenerate.length; i++) {
		const post = addAdditionalData(postsToGenerate[i]);
		const generator = getGenerator(post);
		const content = await generator(post);

		const pathToPost = join(PRIME_POST_FOLDER, `how-to-get-${post.normalizedPrimedItem}-prime.md`);
		await fs.writeFile(pathToPost, content);
	}

	return false;
}

const addAdditionalData = (post) => {
	post.normalizedPrimedItem = post.primedItem.toLowerCase()
		.replace(/&/g, '-and-')
		.replace(/\s/g, '');

	return post;
}

const getGenerator = (post) => {
	if(post.access === 'VAULTED') {
		return generateVaultedPrimePost;
	} else if(post.access === 'UNVAULTED') {
		return generateUnvaultedPrimePost;
	} else if(post.access === 'NEW') {
		return generateNewPrimePost;
	}
}