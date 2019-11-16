import * as System from '/js/br-engine.js';

let pos_x = 0;
let pos_y = 0;

System.set({
	screenWidth: 350,
	screenHeight: 250,
	ticsPerSec: 60
});

System.loadSprite('test', 'temp-01.png');

// Defines how the game is rendered
System.setRender(() => {

	System.clear();
	System.drawSprite('test', pos_x, pos_y);

});

// Defines what happens every tic
System.setTic(() => {

	if (System.key('up')) {
		pos_y++;
	}
	if (System.key('down')) {
		pos_y--;
	}
	if (System.key('left')) {
		pos_x--;
	}
	if (System.key('right')) {
		pos_x++;
	}
	
	// Runs every tic
	System.render();

});

System.ready(() => {

	// Will run when everything is ready (sprites are loaded)
	// Before the tics and renders start

});

// Test