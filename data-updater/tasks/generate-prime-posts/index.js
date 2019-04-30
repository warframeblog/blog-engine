
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

const dropsPageData = require('@drops-page-data');

const generateVaultedPrimePost = require('./vaulted');
const generateNewPrimePost = require('./new');
const generateUnvaultedPrimePost = require('./unvaulted');

const PRIME_POST_FOLDER = join(__basedir, process.env.REPO_FOLDER, 'content', 'primes')

module.exports = async() => {
	const postsToGenerate = [
		// {primedItem: 'Tipedo', alongWith: ['Equinox', 'Stradavar']},
		// {primedItem: 'Stradavar', alongWith: ['Tipedo', 'Equinox']},
		// {primedItem: 'Equinox', alongWith: ['Tipedo', 'Stradavar']},
		{primedItem: 'Volt', alongWith: ['Odonata'], state: 'unvaulted'},
	];

	const $ = await dropsPageData.load();
	for(let i = 0; i < postsToGenerate.length; i++) {
		const postData = addAdditionalData(postsToGenerate[i]);
		const generator = getGenerator(postData);
		const content = await generator($, postData);

		const pathToPost = join(PRIME_POST_FOLDER, `how-to-get-${postData.normalizedPrimedItem}-prime.md`);
		await fs.writeFile(pathToPost, content);
	}

	return false;
}

const addAdditionalData = (postData) => {
	postData.normalizedPrimedItem = postData.primedItem.toLowerCase()
		.replace(/&/g, '-and-')
		.replace(/\s/g, '');

	return postData;
}

const getGenerator = (postData) => {
	if(postData.state === 'vaulted') {
		return generateVaultedPrimePost;
	} else if(postData.state === 'unvaulted') {
		return generateUnvaultedPrimePost;
	} else if(postData.state === 'new') {
		return generateNewPrimePost;
	}

	return null;
}