var fs       = require ('fs'),
	readline = require ('readline'),
	PNG      = require ('pngjs').PNG,
	colors   = require ('colors');

// Determine argument options for including the HTML file and the names for the
// PNG and HTML files
var includeHTML = false,
	fileName = false;

// Mandelbrot default values
var width = 1440,
	height = 1320,
	xmin = -2,
	xmax = 0.55,
	ycenter = 0,
	maxMagnitude = 50,
	iterations = 150,

	includeR = 0x0,
	includeG = 0x0,
	includeB = 0x0,
	includeA = 0xff,
	escapeR  = 0xff,
	escapeG  = 0xff,
	escapeB  = 0xff,
	escapeA  = 0xff;

// Gracefully exit node by letting the user know that the image might be corrupted
process.on ('SIGINT', function () {
	console.log ('\nThe current process has been terminated. Note that the files might be corrupted.');
	process.exit (0);
});

// Begin mandelbrot calculation loops
for (var i = 2; i < process.argv.length; i++) {
	if (process.argv[i].match (/^--?html$/i))
		includeHTML = true;

	else if (process.argv[i].match (/^--?filename:/i))
		fileName = process.argv[i].replace (/\/|\?|<|>|\\|:|\*|\||"|^--?filename:/gi, '');

	else if (process.argv[i].match (/^--?size:\d+\D\d+$/i)) {
		var dimensions = process.argv[i].match (/\d+/g);
		width = dimensions[0];
		height = dimensions[1];
	}

	else if (process.argv[i].match (/^--?xmin:\-?\d+\.?\d*$/i))
		xmin = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

	else if (process.argv[i].match (/^--?xmax:\-?\d+\.?\d*$/i))
		xmax = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

	else if (process.argv[i].match (/^--?ycenter:\-?\d+\.?\d*$/i))
		ycenter = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

	else if (process.argv[i].match (/^--?maxMagnitude:\-?\d+\.?\d*$/i))
		maxMagnitude = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

	else if (process.argv[i].match (/^--?iterations:\d+$/i))
		iterations = +process.argv[i].match (/\d+/)[0];

	else if (process.argv[i].match (/^--?includeRGB:#[0-9a-f]{6}$/i)) {
		var components = process.argv[i].replace (/^--?includeRGBA:#/i, '').match (/[0-9a-f]{2}/gi);
		includeR = +('0x' + components[0]);
		includeG = +('0x' + components[1]);
		includeB = +('0x' + components[2]);
		includeA = +('0x' + components[3]);
	}

	else if (process.argv[i].match (/^--?escapeRGB:#[0-9a-f]{6}$/i)) {
		var components = process.argv[i].replace (/^--?escapeRGBA:#/i, '').match (/[0-9a-f]{2}/gi);
		escapeR = +('0x' + components[0]);
		escapeG = +('0x' + components[1]);
		escapeB = +('0x' + components[2]);
		escapeA = +('0x' + components[3]);
	}
}

// Hot fix for negative y-center movement
ycenter *= -1;

var htmlFile = fileName? fileName + '.html' : 'mandelbrot.html',
	pngFile  = fileName? fileName + '.png' : 'mandelbrot.png';

// Used to map the ascii corresponding to a shade value range
function calculatePixel (v) {
	if      (v < 0.0333) return ' ';
	else if (v < 0.0666) return '`';
	else if (v < 0.1000) return '.';
	else if (v < 0.1333) return '-';
	else if (v < 0.1666) return "'";
	else if (v < 0.2000) return '^';
	else if (v < 0.2333) return '"';
	else if (v < 0.2666) return ':';
	else if (v < 0.3000) return '!';
	else if (v < 0.3333) return '+';
	else if (v < 0.3666) return '?';
	else if (v < 0.4000) return '[';
	else if (v < 0.4333) return '|';
	else if (v < 0.4666) return 't';
	else if (v < 0.5000) return 'j';
	else if (v < 0.5333) return 'u';
	else if (v < 0.5666) return 'x';
	else if (v < 0.6000) return 'z';
	else if (v < 0.6333) return 'U';
	else if (v < 0.6666) return 'O';
	else if (v < 0.7000) return 'Y';
	else if (v < 0.7333) return 'Z';
	else if (v < 0.7666) return 'X';
	else if (v < 0.8000) return 'p';
	else if (v < 0.8333) return 'b';
	else if (v < 0.8666) return '%';
	else if (v < 0.9000) return 'k';
	else if (v < 0.9333) return '@';
	else if (v < 0.9666) return 'M';
	else                 return '#';
}

console.log ('\nConstructing the mandelbrot image!\n'.green);

var time0 = Date.now ();
if (includeHTML) {
	var css = [
		'word-wrap: break-word;',
		'white-space: pre;',
		'display: block;',
		'line-height: 0.8em;',
		'letter-spacing: 1.9px'
	];

	fs.writeFileSync(htmlFile, '<pre style="' + css.join (' ') + '">\n');
}

if (includeHTML) console.log ('    HTML file is included.'.cyan);
console.log (('    dimensions: ' + width + 'x' + height).magenta);
console.log (('    iterations: ' + iterations + ' per pixel\n').magenta);
console.log (('    escape mag: ' + maxMagnitude).magenta);
console.log (('          xmin: ' + xmin).magenta);
console.log (('          xmax: ' + xmax).magenta);

// Internal values calculated from manipulated values above
var xWidth = Math.abs (xmin - xmax),
	yHalfHeight = xWidth * height / width / 2;

// ymin and ymax are calculated from the ycenter to avoid skewing the image for the arbitrary
// width and height values
var ymin = ycenter - yHalfHeight,
	ymax = ycenter + yHalfHeight;

console.log (('          ymin: ' + ymin).magenta);
console.log (('          ymax: ' + ymax + '\n\n').magenta);

maxMagnitude *= maxMagnitude;

// Used for animation purposes
var working = ['⠋', '⠙', '⠚', '⠓'],
	icon = 0,
	interval = 100, // milliseconds
	tIcon0 = Date.now ();

// PNG container stream options
var RGBA_COLOR_TYPE = 6;
var options = {
	width: width,
	height: height,
	colorType: RGBA_COLOR_TYPE,
	filterType: -1
};

// Stores the PNG data
var png = new PNG (options);

for (var j = 0; j < height; j++) {
	// Used to store set information in lieu of image data
	var imageRow = '',
		py = j / height,
		y0 = (1 - py) * ymin + (py) * ymax;

	for (var i = 0; i < width; i++) {
		var px = i / width,
			x0 = (1 - px) * xmin + (px) * xmax;

		// Calculates the next mandelbrot string value
		var xi = x0, yi = y0, broke = false, k;
		for (k = 0; k < iterations; k++) {
			var x_i = xi,
				y_i = yi;

			xi = x_i * x_i - y_i * y_i + x0;
			yi = 2 * x_i * y_i + y0;

			// Break if bigger than the maximum value allowed value for magnitude
			if ((xi * xi + yi * yi) > maxMagnitude) {
				broke = true;
				break;
			}
		}

		// Calculate k smooth for smooth coloration of the mandelbrot image and plot the color
		var val = xi * xi + yi * yi;
		var mu = k + 1 - Math.log (0.5 * Math.log (val)) / Math.log (2);
		mu /= iterations;

		// Append the new pixel to file
		var idx = 4 * (width * j + i);
		if (k == iterations) {
			if (includeHTML) imageRow += '#';

			png.data[idx]     = includeR;  // red
			png.data[idx + 1] = includeG;  // green
			png.data[idx + 2] = includeB;  // blue
			png.data[idx + 3] = includeA; // alpha
		}

		else {
			if (includeHTML) imageRow += calculatePixel (mu);

			png.data[idx]     = Math.round (mu * escapeR); // red
			png.data[idx + 1] = Math.round (mu * escapeG); // green
			png.data[idx + 2] = Math.round (mu * escapeB); // blue
			png.data[idx + 3] = escapeA;                   // alpha
		}

		// Force update percentage if time to update loading icon
		if (Date.now () - tIcon0 >= interval) {
			var percent = Math.round(100 * 1000 * (py + px / height)) / 1000 + '';
			while (percent.length < 6) percent += '0';
			percent += '%';

			// Refresh line rather than appending to it in the console
			readline.moveCursor (process.stdout, 0, -1);
			readline.clearLine (process.stdout, 0);

			icon = (icon + 1) % working.length;
			tIcon0 = Date.now ();

			console.log ('    ' + working[icon] + '     ' + percent);
		}
	}

	if (includeHTML) fs.appendFileSync (htmlFile, imageRow + '\n');

	// Update the new percentage to the screen on every 3rd row to avoid unnecessary performance reduction
	if (!(j % 3)) {
		var percent = Math.round(100 * 1000 * (j / height + i / width / height)) / 1000 + '';
		while (percent.length < 6) percent += '0';
		percent += '%';
		
		readline.moveCursor (process.stdout, 0, -1);
		readline.clearLine (process.stdout, 0);

		// Update loading icon if interval time has passed
		if (Date.now () - tIcon0 >= interval) {
			icon = (icon + 1) % working.length;
			tIcon0 = Date.now ();
		}

		console.log ('    ' + working[icon] + '     ' + percent);
	}
}

// Close the HTML tag of the ascii file if necessary
if (includeHTML) fs.appendFileSync (htmlFile, '</pre>');


// Ensure that the animation is still running to prevent panic
var exeCount = 0,
	dotCount = 0,
	dots = '';

var finalAnimationInterval = setInterval(function () {
	if (!(exeCount++ % 4)) {
		switch (dotCount++ % 4) {
			case 0:
				dots = '';
				break;

			case 1:
				dots = '.';
				break;

			case 2:
				dots = '..';
				break;

			case 3:
				dots = '...';
				break;
		}
	}

	readline.moveCursor (process.stdout, 0, -1);
	readline.clearLine (process.stdout, 0);

	console.log ('    ' + working[icon++ % working.length] + '     Flushing data to disk' + dots);
}, interval);

// Log that packing PNG data will begin
readline.moveCursor (process.stdout, 0, -1);
readline.clearLine (process.stdout, 0);
console.log (('    Packing raw PNG data...').yellow);

// Pipe the generated PNG information into the final output write stream
png.pack ().pipe (fs.createWriteStream (pngFile)).on ('error', function (err) {
	console.log (('\nThere was an error writing the PNG file').red);
	console.log (('' + err).red);

	if (includeHTML) 
		console.log (('\nHowever, the HTML file "' + htmlFile + '" was successfully saved in ' + __dirname).yellow);
}).on ('finish', function () {
	// Stop the final animation from running
	clearInterval (finalAnimationInterval);

	// Clear the previously logged line to log the final percent and time of execution
	readline.moveCursor (process.stdout, 0, -1);
	readline.clearLine (process.stdout, 0);

	var exeTimeInSeconds = (Date.now () - time0) / 1000,
		exeTimeInMinutes = exeTimeInSeconds / 60,
		exeTimeInHours   = exeTimeInMinutes / 24,

		s = Math.round (1000 * (exeTimeInSeconds % 60)) / 1000,
		m = Math.floor (exeTimeInSeconds / 60),
		h = Math.floor (exeTimeInMinutes / 60),
		d = Math.floor (exeTimeInHours   / 24);

	var timeString = (d? d + 'd ' : '') + (h? h + 'h ' : '') + (m? m + 'm ' : '') + s + 's (' +
		(1000 * exeTimeInSeconds) + 'ms)';

	console.log (('    100.000% - ' + timeString).green);
	console.log (('\nThe file' + (includeHTML? 's' : '') + ' "' +
		pngFile + '"' + (includeHTML? ' and "' + htmlFile + '"' +
			' were' : ' was') + ' successfully saved in ' + __dirname).green);
});
