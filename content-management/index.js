const fs = require('fs').promises;
const join = require('path').join;

const matter = require('gray-matter');

const PATH_TO_CONTENT_FOLDER = join(__basedir, process.env.REPO_FOLDER, process.env.CONTENT_FOLDER);

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
	const relativePathToPost = post.section ? join(post.section, post.name) : post.name;
	return join(PATH_TO_CONTENT_FOLDER, relativePathToPost);
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