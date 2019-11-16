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
		scaleSprites();
		if (render_ready) {
			render();
		}
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

let render_ready = false;
let render;
const callRender = () => {
	render();
};
export const setRender = method => {
	render = method;
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
const spriteMap = {};
const scaledSpriteMap = {};
const spriteBuffer = [];

const scaleSprite = spriteId => {

	let img = spriteMap[spriteId];
	let canvasWidth = img.width;
	let canvasHeight = img.height;

	let canvas = document.createElement('canvas');
	canvas.width = canvasWidth;
	canvas.height = canvasWidth;
	
	let ctx = canvas.getContext('2d');
	
	ctx.drawImage(img, 0, 0);
	let {data} = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

	canvas.width = canvasWidth*pixelSize;
	canvas.height = canvasWidth*pixelSize;

	let x = 0, y = 0;
	for (let i=0; i<data.length; i+=4) {
		let r = data[i];
		let g = data[i + 1];
		let b = data[i + 2];
		let a = data[i + 3]/255;
		let color = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
		if (r === 255 && g === 0 && b === 255 && a === 1) {
			color = 'rgba(0, 0, 0, 0)';
		}
		ctx.fillStyle = color;
		ctx.fillRect(x*pixelSize, y*pixelSize, pixelSize, pixelSize);
		if (++x === canvasWidth) {
			x = 0;
			++ y;
		}
	}

	let scaled = scaledSpriteMap[spriteId];
	if (!scaled) {
		scaled = document.createElement('img');
		scaledSpriteMap[spriteId] = scaled;
	}
	scaled.src = canvas.toDataURL();

};

const scaleSprites = () => {
	for (let spriteId in spriteMap) {
		scaleSprite(spriteId);
	}
};

const loadSprites = callback => {
	
	console.log('Loading sprites');
	let counter = spriteBuffer.length;
	
	spriteBuffer.forEach(({spriteId, fileName}) => {
	
		const img = document.createElement('img');
		img.src = 'sprites/' + fileName;
		wrapSprites.appendChild(img);
	
		img.onload = () => {
			if (!spriteMap[spriteId]) {
				spriteMap[spriteId] = img;
				console.log('Sprite ' + spriteId + ' loaded');
				if (--counter === 0 && callback) callback();
			}
		};

	});
};

export const loadSprite = (spriteId, fileName) => {
	spriteBuffer.push({spriteId, fileName});
};

export const drawSprite = (spriteId, x, y) => {
	x = Math.floor(x);
	y = Math.floor(y);
	const img = scaledSpriteMap[spriteId];
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
		render();
		ctx.fillText(`${x}, ${screenHeight - y - 1}`, canvasWidth/2, canvasHeight/2);
	});

	bindKeys();

	loadSprites(() => {
		console.log('All sprites loaded');
		scaleSprites();
		render_ready = true;
		init();
		start();
	});

	handleResize();
	window.addEventListener('resize', handleResize);

});