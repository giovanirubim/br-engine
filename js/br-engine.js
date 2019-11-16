let canvas;
let ctx;
let sx, sy;
let spriteTarget;

const spriteMap = {};
const spriteBuffer = [];
let nSpritesLoaded = 0;

const allSpritesLoaded = () => {
	console.log('All sprites loaded');
	init();
};

const spriteLoaded = () => {
	++ nSpritesLoaded;
	if (nSpritesLoaded === spriteBuffer.length) {
		allSpritesLoaded();
	}
};

const loadSprites = () => {
	console.log('Loading sprites');
	spriteBuffer.forEach(({spriteId, fileName}) => {
		const img = document.createElement('img');
		img.src = 'sprites/' + fileName;
		spriteTarget.appendChild(img);
		img.onload = () => {
			if (!spriteMap[spriteId]) {
				spriteMap[spriteId] = img;
				scaleSprite(img);
			} else {
				console.log('Sprite ' + spriteId + ' loaded');
				spriteLoaded()
			}
		};
	});
};

loadSprite = (spriteId, fileName) => {
	spriteBuffer.push({spriteId, fileName});
};
drawSprite = (spriteId, x, y) => {
	const img = spriteMap[spriteId];
	x *= pixel_size;
	y = (screen_size_y - y)*pixel_size - img.height;
	ctx.drawImage(img, x, y);
};

const scaleSprite = img => {

	let sx = img.width;
	let sy = img.height;

	let canvas = document.createElement('canvas');
	canvas.width = sx;
	canvas.height = sx;
	
	let ctx = canvas.getContext('2d');
	
	ctx.drawImage(img, 0, 0);
	let {data} = ctx.getImageData(0, 0, sx, sy);

	canvas.width = sx*pixel_size;
	canvas.height = sx*pixel_size;

	let x = 0, y = 0;
	for (let i=0; i<data.length; i+=4) {
		let r = data[i];
		let g = data[i + 1];
		let b = data[i + 2];
		let a = data[i + 3]/255;
		let color = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
		ctx.fillStyle = color;
		ctx.fillRect(x*pixel_size, y*pixel_size, pixel_size, pixel_size);
		if (++x === sx) {
			x = 0;
			++ y;
		}
	}
	img.src = canvas.toDataURL();

};

clear = () => {
	ctx.clearRect(0, 0, sx, sy);
};

window.addEventListener('load', () => {
	
	canvas = document.querySelector('canvas');
	ctx = canvas.getContext('2d');
	spriteTarget = document.querySelector('#sprites');

	sx = screen_size_x*pixel_size;
	sy = screen_size_y*pixel_size;
	canvas.width = sx;
	canvas.height = sy;
	
	loadSprites();

	canvas.addEventListener('mousemove', e => {
		let x = Math.floor(e.offsetX/pixel_size);
		let y = Math.floor(e.offsetY/pixel_size);
		ctx.fillStyle = '#fff';
		ctx.font = '16px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		render();
		ctx.fillText(`${x}, ${screen_size_y - y - 1}`, sx/2, sy/2);
	});

});