
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

const generateVaultedPrimePost = require('./vaulted');
const generateNewPrimePost = require('./new');

const generatePrimePosts = async() => {
	await generateNewPrimePost();
}

module.exports = generatePrimePosts;