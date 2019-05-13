const fs = require('fs').promises;
const join = require('path').join;

const matter = require('gray-matter');

const CONTENT_FOLDER = 'content';

const getPostContent = async(post) => {
	const pathToPost = getPathToPost(post);
	try {
		const fileContent = await fs.readFile(pathToPost);
		return matter(fileContent);
	} catch(e) {
		console.log(`Cannot read post ${pathToPost} content: ${e}`);
		throw e;
	}
}

const getPathToPost = (post) => {
	const pathToContentFolder = join(__basedir, process.env.REPOS_FOLDER, post.repo, CONTENT_FOLDER);
	const relativePathToPost = post.section ? join(post.section, post.file) : post.file;
	return join(pathToContentFolder, relativePathToPost);
}

const writeNewContent = async(post, content) => {
	const pathToPost = getPathToPost(post);
	try {
		const fileContent = matter.stringify(content);
		return await fs.writeFile(pathToPost, fileContent);
	} catch(e) {
		console.log(`Cannot write new content to ${pathToPost}: ${e}`);
		throw e;
	}
}

module.exports = {
	getPostContent,
	writeNewContent
}