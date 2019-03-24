const fs = require('fs').promises;

const matter = require('gray-matter');

const updatePostDate = async(pathToPost) => {
	const postContent = await getPostContent(pathToPost);
	const contentFile = matter(postContent);

	contentFile.data.date = new Date();

	await writeNewContent(pathToPost, contentFile.stringify());

	console.log(`Post ${pathToPost} date was changed to ${contentFile.data.date}`);
}

const getPostContent = async(pathToPost) => {
	try {
		return await fs.readFile(pathToPost);
	} catch(e) {
		console.log(`Cannot read post ${pathToPost} content: ${e}`);
		throw e;
	}
}

const writeNewContent = async(pathToPost, content) => {
	try {
		return await fs.writeFile(pathToPost, content);
	} catch(e) {
		console.log(`Cannot write new content to ${pathToPost}: ${e}`);
		throw e;
	}
}

module.exports = updatePostDate;