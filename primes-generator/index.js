
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

const generatePrimePosts = async() => {
	const toGen = [
		{primedItem: 'Tipedo', alongWith: ['Equinox', 'Stradavar']},
		{primedItem: 'Stradavar', alongWith: ['Tipedo', 'Equinox']},
		{primedItem: 'Equinox', alongWith: ['Tipedo', 'Stradavar']}
	];

	for(let i =0; i< toGen.length; i++) {
		const content = await generateNewPrimePost(toGen[i]);
		const normalizedPrimedItem = toGen[i].primedItem.toLowerCase()
			.replace(/&/g, '-and-')
			.replace(/\s/g, '');
		
		await fs.writeFile(join(__basedir, process.env.REPO_FOLDER, 'content', 'primes', `how-to-get-${normalizedPrimedItem}-prime.md`), 
			content);
	}
}

module.exports = generatePrimePosts;