import * as System from '/js/br-engine.js';

let blocks = [];
let dir = 'right';
const addBlock = (x, y, sx, sy) => {
	blocks.push({
		pos: System.vec2(x, y),
		hitbox: System.vec2(sx, sy),
	});
};
let rocket = {
	pos: System.vec2(90, 0),
	hitbox: System.vec2(20, 10)
};
let ticCounter = 0;
let screenWidth = 200;
let screenHeight = 100;

// addBlock(150, 70, 10, 10);
addBlock(130, 54, 10, 10);

System.set({
	screenWidth: screenWidth,
	screenHeight: screenHeight,
	ticsPerSec: 24
});

System.loadSprite('star', 'star.png');
System.loadSprite('rocket0right', 'rocket.png');
System.loadSprite('rocket1right', 'rocket.png', true, 2);
System.loadSprite('rocket0left', 'rocket.png', false, 2);
System.loadSprite('rocket1left', 'rocket.png', true, 0);
System.loadSprite('rocket0up', 'rocket.png', false, 3);
System.loadSprite('rocket1up', 'rocket.png', true, 1);
System.loadSprite('rocket0down', 'rocket.png', false, 1);
System.loadSprite('rocket1down', 'rocket.png', true, 3);

const drawRocket = () => {
	const {pos, hitbox} = rocket;
	System.drawSprite('rocket' + (ticCounter&1) + dir, pos.x, pos.y);
	System.drawRect(pos.x, pos.y, hitbox.x, hitbox.y, 'rgba(0, 192, 255, 0.1)');
};

const drawBlocks = () => {
	blocks.forEach(({pos, hitbox}) => {
		System.drawRect(pos.x, pos.y, hitbox.x, hitbox.y);
	});
};

// Defines how the game is rendered
System.setRender(() => {

	System.clear();
	drawRocket();
	drawBlocks();

});

// Defines what happens every tic
System.setTic(() => {

	if (System.key('up')) {
		if (dir === 'right' || dir === 'left') {
			rocket.pos.add(5, -5);
			rocket.hitbox.swap();
			dir = 'up';
		}
	}
	if (System.key('down')) {
		if (dir === 'right' || dir === 'left') {
			rocket.pos.add(5, -5);
			rocket.hitbox.swap();
			dir = 'down';
		}
	}
	if (System.key('right')) {
		if (dir === 'up' || dir === 'down') {
			rocket.pos.add(-5, 5);
			rocket.hitbox.swap();
			dir = 'right';
		}
	}
	if (System.key('left')) {
		if (dir === 'up' || dir === 'down') {
			rocket.pos.add(-5, 5);
			rocket.hitbox.swap();
			dir = 'left';
		}
	}

	if (dir === 'right') {
		rocket.pos.x ++;
	} else if (dir === 'down') {
		rocket.pos.y --;
	} else if (dir === 'left') {
		rocket.pos.x --;
	} else if (dir === 'up') {
		rocket.pos.y ++;
	}

	let {pos} = rocket;
	++ ticCounter;

	let colisionDist = Infinity;
	let colisionDir = null;
	blocks.forEach(block => {
		let args = [rocket.pos, rocket.hitbox, block.pos, block.hitbox];
		if (dir === 'right') {
			let dist = System.colisionDistRight(...args);
			if (dist < 0) {
				rocket.pos.x += dist;
			}
		}
		if (dir === 'left') {
			let dist = System.colisionDistLeft(...args);
			if (dist < 0) {
				rocket.pos.x -= dist;
			}
		}
		if (dir === 'up') {
			let dist = System.colisionDistUp(...args);
			if (dist < 0) {
				rocket.pos.y += dist;
			}
		}
		if (dir === 'down') {
			let dist = System.colisionDistDown(...args);
			if (dist < 0) {
				rocket.pos.y -= dist;
			}
		}
	});

	System.render();

});

System.ready(() => {

	rocket.pos.y = screenHeight/2 - rocket.hitbox.y/2;
	System.render();

});