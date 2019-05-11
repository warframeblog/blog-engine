const fs = require('fs').promises;
const join = require('path').join;

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const tinify = require('tinify');

tinify.key = process.env.TINIFY_API_KEY;

const upload = multer();
const router = express.Router();

const JPG_MIME_TYPE = 'image/jpeg';
const JPG_FILE_EXT = '.jpg';

const CONTENT_IMG_TYPE = 'content';
const FEATURE_IMG_TYPE = 'feature';

const IMAGE_BASE_FOLDER = join(__basedir, 'images2019');

router.route('/').post(upload.single('image'), async (req, res, next) => {
	const file = req.file;
	if(!file) {
		throw new Error(`One of the required params isn't provided`);
	}

	const imageBuffer = file.buffer;
	const originalType = file.mimetype;

	const name = file.originalname.split('.')[0];
	const imageType = req.query.type || CONTENT_IMG_TYPE;
	const jpgImageBuffer = await transformToJPG(originalType, imageBuffer);
	const resizedImages = await resize(name, imageType, jpgImageBuffer);

	const pathToSaveImages = await fulfillFolderStructure(IMAGE_BASE_FOLDER, imageType);
	await saveImagesToDisk(pathToSaveImages, resizedImages);

	const title = req.query.title || '';
	const alt = req.query.alt || '';
	const result = produceResult(imageType, resizedImages, title, alt);
	res.json(result);
});

const transformToJPG = async (type, imageBuffer) => {
	if(type === JPG_MIME_TYPE) {
		return imageBuffer;
	}

	try {
		return await sharp(imageBuffer)
		  .jpeg()
		  .toBuffer();
	} catch(e) {
		console.log(`Cannot transform image to jpg format`);
	}
}

const minifyImage = async (imageBuffer) => {
	try {
		return await tinify.fromBuffer(imageBuffer).toBuffer();
	} catch(e) {
		console.log(`Cannot minify image ${e}`);
	}
}

const resize = async (name, imageType, imageBuffer) => {
	const originalImageMetadata = await sharp(imageBuffer).metadata();
	const originalImageWidth = originalImageMetadata.width
	try {
		const resizeList = composeResizeImageList(name, imageType, originalImageWidth, imageBuffer);
		return Promise.all(resizeList.map(resize => resize.call(null, originalImageWidth, name, imageBuffer)));
	} catch(e) {
		console.log(`Cannot resize some of the images ${e}`);
	}
}

const composeResizeImageList = (name, imageType, originalWidth, imageBuffer) => {
	if(imageType === FEATURE_IMG_TYPE) {
		return [resizeToLargeSize, resizeToThumbnailSize];
	}

	if(originalWidth >= 960) {
		return [resizeToLargeSize, resizeToMediumSize, resizeToSmallSize];
	} else if(originalWidth >= 768) {
		return [resizeToMediumSize, resizeToSmallSize];
	} else {
		return [() => ({buffer: imageBuffer, width: originalWidth, filename: name + JPG_FILE_EXT})];
	}
}

const resizeToLargeSize = async (originalWidth, name, imageBuffer) => {
	const width = 960;
	const resizeConfig = { method: 'scale', width };
	const filename = name + JPG_FILE_EXT;	
	return await resizeImage(filename, imageBuffer, originalWidth, resizeConfig);
}

const resizeToMediumSize = async (originalWidth, name, imageBuffer) => {
	const width = 768;
	const resizeConfig = { method: 'scale', width };
	const filename = `${name}-${width}` + JPG_FILE_EXT;	
	return await resizeImage(filename, imageBuffer, originalWidth, resizeConfig);
}

const resizeToSmallSize = async (originalWidth, name, imageBuffer) => {
	const width = 640;
	const resizeConfig = { method: 'scale', width };
	const filename = `${name}-${width}` + JPG_FILE_EXT;	
	return await resizeImage(filename, imageBuffer, originalWidth, resizeConfig);
}

const resizeToThumbnailSize = async (originalWidth, name, imageBuffer) => {
	const width = 360;
	const height = 240;
	const resizeConfig = { method: 'thumb', width, height };
	const filename = `${name}-${width}x${height}` + JPG_FILE_EXT;	
	return await resizeImage(filename, imageBuffer, originalWidth, resizeConfig);
}

const resizeImage = async (filename, imageBuffer, originalWidth, resizeConfig) => {
	let resizedImage = imageBuffer;
	try {
		resizedImage = await tinify.fromBuffer(imageBuffer).resize(resizeConfig).toBuffer();
	} catch(e) {
		console.log(`Cannot resize image ${e}`);
	}
	return {buffer: resizedImage, width: resizeConfig.width, height: resizeConfig.height, filename};
}

const fulfillFolderStructure = async (baseFolder, imageType) => {
	try {
		const pathToSaveImages = join(baseFolder, setUpAdditionalFolders(imageType));
		await fs.mkdir(pathToSaveImages, { recursive: true });
		return pathToSaveImages;
	} catch(e) {
		console.log(`Cannot create missing subfolders ${e}`);
	}
}

const setUpAdditionalFolders = (imageType) => {
	if(FEATURE_IMG_TYPE === imageType || CONTENT_IMG_TYPE === imageType) {
		const currentDate = new Date();
		return '0' + (currentDate.getMonth() + 1);
	}
}

const saveImagesToDisk = async (pathToSaveImages, images) => {
	const imagesToSave = images.map(img => fs.writeFile(join(pathToSaveImages, img.filename), img.buffer));
	try {
		return await Promise.all(imagesToSave);
	} catch(e) {
		console.log(`Cannot save some of the images ${e}`);
	}
}


const produceResult = (imageType, resizedImages, title, alt) => {
	let result = {};
	const prefix = getUrlPrefix(imageType);
	const pathToDefaultImage = prefix + resizedImages[0].filename;
	result.url = pathToDefaultImage
	result.shortcode = `{{< image title="${title}" alt="${alt}" src="${pathToDefaultImage}" `;
	if(resizedImages.length > 1) {
		result.shortcode += `srcset="`;
		result.shortcode += resizedImages.map(img => `${prefix + img.filename} ${img.width}w`).join(', ');
		result.shortcode += `" `;
	}
	result.shortcode += `>}}`;
	return result;
}

const getUrlPrefix = (imageType) => {
	if(imageType === FEATURE_IMG_TYPE || imageType === CONTENT_IMG_TYPE) {
		const currentDate = new Date();
		return '/wp-content/uploads/' + currentDate.getFullYear().toString() + '/0' + (currentDate.getMonth() + 1) + '/'
	}
}

module.exports = router;
