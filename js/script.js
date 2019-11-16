loadSprite('test', 'temp-01.png');

pixel_size = 3;
screen_size_x = 350;
screen_size_y = 250;

render = () => {

	clear();
	drawSprite('test', 0, 0);

};

init = () => {

	render();

};