const fs = require('fs').promises;

const _ = require('lodash');

module.exports = async(pathToDataFiles, currentData) => {
	if(pathToDataFiles.length !== currentData.length) {
		throw new Error(`Length of pathToDataFiles and data has to be equal`);
	}

	const previousData = await getPreviousData(pathToDataFiles);
	console.log(`Previous data: ${previousData}`)
	const dataDiff = currentData.map((data, index) => {
		return _.isEqual(data, previousData[index]) ? null : data;
	});

	const dataToUpdate = dataDiff
		.map(mapFilePathToData(pathToDataFiles))
		.filter(fileToWrite => fileToWrite !== null);
	await updateData(dataToUpdate);

	return dataDiff.some(data => data !== null);
}

const getPreviousData = async(pathToDataFiles) => {
	const previousDataContents = await getPreviousDataContents(pathToDataFiles);
	return previousDataContents
		.map(buf => buf.toString())
		.map(jsonToObject);
}

const getPreviousDataContents = async(pathToDataFiles) => {
	const previousDataToRead = pathToDataFiles.map(path => fs.readFile(path));

	try {
		return await Promise.all(previousDataToRead);
	} catch(e) {
		console.log(`Cannot read all previous data files ${e}`);
		throw e;
	}
}

const jsonToObject = (json) => {
	try {
		return JSON.parse(json);
	} catch(e) {
		console.log(`Cannot parse json: ${json}`)
		throw e;
	}
}

const mapFilePathToData = (pathToDataFiles) => {
	return (data, index) => {
		if(data === null) {
			return null;
		} 
		const pathToFile = pathToDataFiles[index];
		return fs.writeFile(pathToFile, objectToJson(data));
	}
}

const objectToJson = (obj) => {
	try {
		return JSON.stringify(obj);
	} catch(e) {
		console.log(`Cannot serialize to json: ${obj}`);
		throw e;
	}
}

const updateData = async(dataToUpdate) => {
	try {
		return await Promise.all(dataToUpdate);
	} catch(e) {
		console.log(`Cannot update contents of data files: ${e}`);
		throw e;
	}
}