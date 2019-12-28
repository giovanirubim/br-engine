// - vec2 --------------------------------------------------------------------------------------- //

class Vector2 {
	constructor() {
		const argc = arguments.length;
		this.x = 0;
		this.y = 0;
		if (argc === 1) {
			const arg = arguments[0];
			if (arg instanceof Vector2) {
				this.x = arg.x;
				this.y = arg.y;
			} else if (typeof arg === 'number') {
				this.x = arg;
				this.y = arg;
			}
		} else if (argc === 2) {
			const [a, b] = arguments;
			this.x = a;
			this.y = b;
		}
	}
	add() {
		const argc = arguments.length;
		if (argc === 1) {
			const arg = arguments[0];
			if (arg instanceof Vector2) {
				this.x += arg.x;
				this.y += arg.y;
			} else if (typeof arg === 'number') {
				this.x += arg;
				this.y += arg;
			}
		} else if (argc === 2) {
			const [a, b] = arguments;
			this.x += a;
			this.y += b;
		}
		return this;
	}
	sub() {
		const argc = arguments.length;
		if (argc === 1) {
			const arg = arguments[0];
			if (arg instanceof Vector2) {
				this.x -= arg.x;
				this.y -= arg.y;
			} else if (typeof arg === 'number') {
				this.x -= arg;
				this.y -= arg;
			}
		} else if (argc === 2) {
			const [a, b] = arguments;
			this.x -= a;
			this.y -= b;
		}
		return this;
	}
	set() {
		const argc = arguments.length;
		if (argc === 1) {
			this.x = this.y = arguments[0];
		} else if (argc === 2) {
			const [x, y] = arguments;
			this.x = x;
			this.y = y;
		}
		return this;
	}
	swap() {
		const {x, y} = this;
		this.x = y;
		this.y = x;
		return this;
	}
	length() {
		const {x, y} = this;
		return Math.sqrt(x*x + y*y);
	}
	clone() {
		return new Vector2(this);
	}
}

export const vec2 = function() {
	return new Vector2(...arguments);
};

// - Hitbox colision ---------------------------------------------------------------------------- //

export const colisionDistRight = (pos_1, hitbox_1, pos_2, hitbox_2) => {
	if (pos_1.y >= pos_2.y + hitbox_2.y) return Infinity;
	if (pos_2.y >= pos_1.y + hitbox_1.y) return Infinity;
	const front = pos_1.x + hitbox_1.x;
	const center = pos_2.x + hitbox_2.x/2;
	if (front > center) return Infinity;
	return pos_2.x - front;
};

export const colisionDistLeft = (pos_1, hitbox_1, pos_2, hitbox_2) => {
	if (pos_1.y >= pos_2.y + hitbox_2.y) return Infinity;
	if (pos_2.y >= pos_1.y + hitbox_1.y) return Infinity;
	const center = pos_2.x + hitbox_2.x/2;
	if (pos_1.x < center) return Infinity;
	return pos_1.x - (pos_2.x + hitbox_2.x);
};

export const colisionDistUp = (pos_1, hitbox_1, pos_2, hitbox_2) => {
	if (pos_1.x >= pos_2.x + hitbox_2.x) return Infinity;
	if (pos_2.x >= pos_1.x + hitbox_1.x) return Infinity;
	const front = pos_1.y + hitbox_1.y;
	const center = pos_2.y + hitbox_2.y/2;
	if (front > center) return Infinity;
	return pos_2.y - front;
};

export const colisionDistDown = (pos_1, hitbox_1, pos_2, hitbox_2) => {
	if (pos_1.x >= pos_2.x + hitbox_2.x) return Infinity;
	if (pos_2.x >= pos_1.x + hitbox_1.x) return Infinity;
	const center = pos_2.y + hitbox_2.y/2;
	if (pos_1.y < center) return Infinity;
	return pos_1.y - (pos_2.y + hitbox_2.y);
};

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
let canvasWidth;
let canvasHeight;
let canvas;
let ctx;
let bgCanvas;
let bgCtx;

let pixelSize = null;
let screenWidth = 80;
let screenHeight = 60;
let fontSize = null;

export const set = config => {
	screenWidth = config.screenWidth || screenWidth;
	screenHeight = config.screenHeight || screenHeight;
	ticsPerSec = config.ticsPerSec || ticsPerSec;
};

const handleResize = () => {
	let width = window.innerWidth;
	let height = window.innerHeight;
	let pixel = Math.min((width - 20)/screenWidth, (height - 20)/screenHeight);
	pixel = Math.max(Math.floor(pixel), 1);
	if (pixel !== pixelSize) {
		pixelSize = pixel;
		fontSize = pixelSize*8;
		canvasWidth = pixelSize*screenWidth;
		canvasHeight = pixelSize*screenHeight;
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		bgCanvas.width = canvasWidth;
		bgCanvas.height = canvasHeight;
		bgCanvas.style.marginBottom = '-' + canvasHeight + 'px';
		spritesUpdate.call();
		callRender();
	}
	wrapCanvas.style.top = Math.floor((height - canvasHeight)/2) + 'px';
	wrapCanvas.style.left = Math.floor((width - canvasWidth)/2) + 'px';
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
let ticCounter = 0;
let ticsPerSec = 20;
let ticInterval = null;
const callTic = () => {
	tic();
	++ ticCounter;
};
export const setTic = method => {
	tic = method;
};
export const countTics = () => {
	return ticCounter;
};
const start = () => {
	if (ticInterval !== null) {
		return;
	}
	console.log('Tics are running');
	let delay = Math.floor(1000/ticsPerSec);
	ticInterval = setInterval(callTic, delay);
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
	let {width, height} = srcImg;

	innerCanvas.width = width;
	innerCanvas.height = height;
	
	innerCtx.drawImage(srcImg, 0, 0);
	const {data} = innerCtx.getImageData(0, 0, width, height);

	innerCanvas.width = width*pixelSize;
	innerCanvas.height = height*pixelSize;

	let h_axis = 'x';
	let v_axis = 'y';
	let max = {x: width, y: height};
	let neg = {x: false, y: false};

	const flipAxis = () => {
		let aux = v_axis;
		v_axis = h_axis;
		h_axis = aux;
	};

	if (mirrored) {
		neg[h_axis] = !neg[h_axis];
	}

	if (rotated === 1) {
		flipAxis();
		neg.y = !neg.y;
	} else if (rotated === 2) {
		neg.y = !neg.y;
		neg.x = !neg.x;
	} else if (rotated === 3) {
		flipAxis();
		neg.x = !neg.x;
	}

	const getColor = (h, v) => {
		if (neg[h_axis]) {
			h = max[h_axis] - h - 1;
		}
		if (neg[v_axis]) {
			v = max[v_axis] - v - 1;
		}
		let c = h_axis === 'x'? (v*max.x + h)*4: (h*max.x + v)*4;
		let r = data[c];
		let g = data[c + 1];
		let b = data[c + 2];
		let a = data[c + 3]/255;
		if (r === 255 && g === 0 && b === 255 && a === 1) {
			return `rgba(0, 0, 0, 0)`;
		}
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	};

	innerCanvas.width = max[h_axis]*pixelSize;
	innerCanvas.height = max[v_axis]*pixelSize;
	for (let v=0; v<max[v_axis]; ++v) {
		for (let h=0; h<max[h_axis]; ++h) {
			const color = getColor(h, v);
			innerCtx.fillStyle = color;
			innerCtx.fillRect(h*pixelSize, v*pixelSize, pixelSize, pixelSize);
		}
	}

	img.width = max[h_axis]*pixelSize;
	img.height = max[v_axis]*pixelSize;
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

		const {fileName} = spriteMap[spriteId];

		if (!spriteSrcMap[fileName]) {
			spriteSrcMap[fileName] = document.createElement('img');
			srcBuffer.push(fileName);
		}
	}

	let counter = srcBuffer.length;
	if (counter === 0) {
		callback && callback();
	}

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
	x = Math.floor(Math.round(x*1e6)/1e6);
	y = Math.floor(Math.round(y*1e6)/1e6);
	const sprite = spriteMap[spriteId];
	if (!sprite) {
		throw 'No sprite called ' + spriteId;
	}
	const {img} = sprite;
	x *= pixelSize;
	y = (screenHeight - y)*pixelSize - img.height;
	ctx.drawImage(img, x, y);
};

// - Math help ---------------------------------------------------------------------------------- //

export const mod = (x, y) => (x % y + y) % y;
export const div = (x, y) => Math.round((x - (x % y))/y);

// - Hand drawings ------------------------------------------------------------------------------ //

export const drawRect = (ax, ay, sx, sy, color) => {
	ax = (Math.floor(ax) + 0.5)*pixelSize;
	ay = (Math.floor(ay) + 0.5)*pixelSize;
	sx = (Math.floor(sx) - 1)*pixelSize;
	sy = (Math.floor(sy) - 1)*pixelSize;
	if (sx < 0 || sy < 0) return;
	ctx.strokeStyle = color || '#07f';
	ctx.lineWidth = pixelSize;
	ctx.beginPath();
	ctx.rect(ax, canvasHeight - ay - sy, sx, sy);
	ctx.stroke();
};

export const write = (text, x, y, color) => {
	ctx.fillStyle = color || '#fff';
	ctx.font = fontSize + 'px monospace';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'bottom';
	ctx.fillText(text, x*pixelSize, (screenHeight - y)*pixelSize);
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
		if (!ticInterval && key === 'enter' || key === '\n') {
			callTic();
			render.call();
		}
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

	const create = (tag, id) => {
		const res = document.createElement(tag);
		res.setAttribute('id', id);
		return res;
	};

	wrapCanvas = create('div', 'wrapcanvas');
	wrapSprites = create('div', 'sprites');
	canvas = create('canvas', 'gamescreen');
	bgCanvas = create('canvas', 'background');
	wrapCanvas.appendChild(canvas);
	wrapCanvas.appendChild(bgCanvas);

	document.body.appendChild(wrapCanvas);
	document.body.appendChild(wrapSprites);

	ctx = canvas.getContext('2d');

	bgCtx = canvas.getContext('2d');

	canvas.addEventListener('mousemove', e => {
		if (!e.ctrlKey) {
			return;
		}
		let x = Math.floor(e.offsetX/pixelSize);
		let y = Math.floor(e.offsetY/pixelSize);
		ctx.fillStyle = '#fff';
		ctx.font = fontSize + 'px monospace';
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