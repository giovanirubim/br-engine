// - Resource Control --------------------------------------------------------------------------- //

class ResourceControl {
	constructor(action) {
		this.map = {};
		this.total = 0;
		this.stacked = false;
		this.action = action;
	}
	needs(resource) {
		const {map} = this;
		map[resource] = (map[resource] || 0) + 1;
		++ this.total;
		return this;
	}
	got(resource) {
		const {map, stacked, action} = this;
		const n = map[resource] = (map[resource] || 0) - 1;
		if (n < 0) {
			throw 'Resource ' + resource + ' is negative';
		}
		if (--this.total === 0 && stacked) {
			action();
		}
		return this;
	}
	clear() {
		this.stacked = false;
		return this;
	}
	call() {
		const {total, action} = this;
		if (total === 0) {
			action();
			this.stacked = false;
			return this;
		}
		this.stacked = true;
		return this;
	}
}

const SPRITES_READY = 1;
const SPRITE_FILES_LOADED = 2;

// - Screen ------------------------------------------------------------------------------------- //

let wrapCanvas;
let canvas;
let canvasWidth;
let canvasHeight;
let ctx;

let pixelSize = null;
let screenWidth = 80;
let screenHeight = 60;

const handleResize = () => {
	let width = window.innerWidth;
	let height = window.innerHeight;
	let pixel = Math.min((width - 20)/screenWidth, (height - 20)/screenHeight);
	pixel = Math.max(Math.floor(pixel), 1);
	if (pixel !== pixelSize) {
		pixelSize = pixel;
		canvas.width = canvasWidth = pixelSize*screenWidth;
		canvas.height = canvasHeight = pixelSize*screenHeight;
		spritesUpdate.call();
		callRender();
	}
	wrapCanvas.style.top = Math.floor((height - canvasHeight)/2) + 'px';
	wrapCanvas.style.left = Math.floor((width - canvasWidth)/2) + 'px';
};

// - Screen ------------------------------------------------------------------------------------- //

export const set = config => {
	screenWidth = config.screenWidth || screenWidth;
	screenHeight = config.screenHeight || screenHeight;
	ticsPerSec = config.ticsPerSec || ticsPerSec;
};

// - Init --------------------------------------------------------------------------------------- //

let init = () => {};
export const ready = method => {
	init = method;
};

// - Render ------------------------------------------------------------------------------------- //

let render = new ResourceControl(() => console.log('Render undefined'));
const callRender = () => {
	render.call();
};
export const setRender = method => {
	render.action = method;
};
export { callRender as render };

export const clear = () => {
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
};

// - Tic ---------------------------------------------------------------------------------------- //

let tic;
let ticsPerSec = 20;
let ticInterval = null;
export const setTic = method => {
	tic = method;
};
const start = () => {
	if (ticInterval !== null) {
		return;
	}
	console.log('Tics are running');
	let delay = Math.floor(1000/ticsPerSec);
	ticInterval = setInterval(tic, delay);
};
const stop = () => {
	if (ticInterval === null) {
		return;
	}
	console.log('Tics were stopped');
	clearInterval(ticInterval);
	ticInterval = null;
};

// - Sprites ------------------------------------------------------------------------------------ //

let wrapSprites;
const spriteSrcMap = {};
const spriteMap = {};
const spriteBuffer = [];
const innerCanvas = document.createElement('canvas');
const innerCtx = innerCanvas.getContext('2d');

const initSprite = sprite => {
	
	const {fileName, mirrored, rotated, img} = sprite;
	const srcImg = spriteSrcMap[fileName];
	const {width, height} = srcImg;
	
	innerCanvas.width = width;
	innerCanvas.height = height;
	
	innerCtx.drawImage(srcImg, 0, 0);
	const {data} = innerCtx.getImageData(0, 0, width, height);

	innerCanvas.width = width*pixelSize;
	innerCanvas.height = height*pixelSize;
	
	const getColor = (x, y) => {
		let c = (y*width + x)*4;
		let r = data[c];
		let g = data[c + 1];
		let b = data[c + 2];
		let a = data[c + 3]/255;
		if (r === 255 && g === 0 && b === 255 && a === 1) {
			return `rgba(0, 0, 0, 0)`;
		}
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	};
	for (let y=0; y<height; ++y) {
		for (let x=0; x<width; ++x) {
			const color = getColor(x, y);
			innerCtx.fillStyle = color;
			innerCtx.fillRect(x*pixelSize, y*pixelSize, pixelSize, pixelSize);
		}
	}
	img.src = innerCanvas.toDataURL();
};

const initSprites = () => {
	for (let id in spriteMap) {
		initSprite(spriteMap[id]);
	}
};

const spritesUpdate = new ResourceControl(initSprites);

const loadSpriteFiles = callback => {
	console.log('Loading sprite files...');

	const srcBuffer = [];
	for (let spriteId in spriteMap) {

		const {fileName, img} = spriteMap[spriteId];

		if (!spriteSrcMap[fileName]) {
			spriteSrcMap[fileName] = img;
			srcBuffer.push(fileName);
		}
	}

	let counter = srcBuffer.length;
	const handleLoaded = fileName => {
		console.log(fileName + ' loaded');
		if (--counter === 0) {
			if (callback) callback();
		}
	};

	srcBuffer.forEach(fileName => {
		const img = spriteSrcMap[fileName];
		img.onload = () => {
			img.onload = null;
			handleLoaded(fileName);
		};
		img.src = 'sprites/' + fileName;
		wrapSprites.appendChild(img);
	});
};

export const loadSprite = (spriteId, fileName, mirrored, rotated) => {
	mirrored = mirrored || false;
	rotated = rotated || 0;
	const img = document.createElement('img');
	spriteMap[spriteId] = {fileName, mirrored, rotated, img};
};

export const drawSprite = (spriteId, x, y) => {
	x = Math.floor(x);
	y = Math.floor(y);
	const {img} = spriteMap[spriteId];
	x *= pixelSize;
	y = (screenHeight - y)*pixelSize - img.height;
	ctx.drawImage(img, x, y);
};

// - Key events --------------------------------------------------------------------------------- //

const keyMap = {};
const keyIsDown = {};
export const logKeys = () => {
	let str = '';
	for (let key in keyMap) {
		if (keyMap[key]) {
			if (str) str += ', ';
			str += key;
		}
	}
	console.log(str);
};
const bindKeys = () => {
	const filterKey = key => key.toLowerCase().replace('arrow', '');
	window.addEventListener('keydown', e => {
		const key = filterKey(e.key);
		const keyLoc = key + (e.location || e.keyLocation);
		if (keyIsDown[keyLoc]) {
			return;
		}
		keyIsDown[keyLoc] = true;
		keyMap[key] = (keyMap[key] || 0) + 1;
		if (e.ctrlKey && e.altKey && key === ' ') {
			if (ticInterval) {
				stop();
			} else {
				start();
			}
		}
	});
	window.addEventListener('keyup', e => {
		const key = filterKey(e.key);
		const keyLoc = key + (e.location || e.keyLocation);
		if (!keyIsDown[keyLoc]) {
			return;
		}
		keyIsDown[keyLoc] = false;
		keyMap[key] = (keyMap[key] || 0) - 1;
	});
};

export const key = name => {
	const val = keyMap[name];
	return val && val > 0 || false;
};

// - Main --------------------------------------------------------------------------------------- //

render.needs(SPRITES_READY);
spritesUpdate.needs(SPRITE_FILES_LOADED);

window.addEventListener('load', () => {
	
	canvas = document.querySelector('#gamescreen');
	ctx = canvas.getContext('2d');

	wrapSprites = document.querySelector('#sprites');
	wrapCanvas = document.querySelector('#wrapcanvas');

	canvas.addEventListener('mousemove', e => {
		if (!e.ctrlKey) {
			return;
		}
		let x = Math.floor(e.offsetX/pixelSize);
		let y = Math.floor(e.offsetY/pixelSize);
		ctx.fillStyle = '#fff';
		ctx.font = '16px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		callRender();
		ctx.fillText(`${x}, ${screenHeight - y - 1}`, canvasWidth/2, canvasHeight/2);
	});

	bindKeys();

	loadSpriteFiles(() => {
		console.log('All sprites loaded');
		spritesUpdate.clear();
		spritesUpdate.got(SPRITE_FILES_LOADED);
		spritesUpdate.call();
		render.got(SPRITES_READY);
		init();
		start();
	});

	handleResize();
	window.addEventListener('resize', handleResize);

});