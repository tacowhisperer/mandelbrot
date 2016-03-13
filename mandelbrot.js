// Determine argument options for including the HTML file and the names for the
// PNG and HTML files
var includeHTML = false,
	fileName = false;

// Mandelbrot default values
var width = 5760,
	height = 5280,
	xmin = -2,
	xmax = 0.55,
	ycenter = 0,
	maxMagnitude = 50,
	iterations = 100;

for (var i = 2; i < process.argv.length; i++) {
	if (process.argv[i].match (/^--?html$/i))
		includeHTML = true;

	else if (process.argv[i].match (/^--?filename\./i))
		fileName = process.argv[i].replace (/\/|\?|<|>|\\|:|\*|\||"|^--?filename\./g, '');

	else if (process.argv[i].match (/^--?size\.\d+\D\d+$/i)) {
		var dimensions = process.argv[i].match (/\d+/g);
		width = dimensions[0];
		height = dimensions[1];
	}

	else if (process.argv[i].match (/^--?xmin\.\-?\d+\.?\d*$/i))
		xmin = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

	else if (process.argv[i].match (/^--?xmax\.\-?\d+\.?\d*$/i))
		xmax = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

	else if (process.argv[i].match (/^--?ycenter\.\-?\d+\.?\d*$/i))
		ycenter = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

	else if (process.argv[i].match (/^--?maxMagnitude\.\-?\d+\.?\d*$/i))
		maxMagnitude = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

	else if (process.argv[i].match (/^--?iterations\.\d+$/i))
		iterations = +process.argv[i].match (/\d+/)[0];
}

var fs = require ('fs'),
	readline = require ('readline'),
	PNG = require ('pngjs').PNG,
	htmlFile = fileName? fileName + '.html' : 'mandelbrot.html',
	pngFile = fileName? fileName + '.png' : 'mandelbrot.png';

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

console.log ('\nConstructing the mandelbrot image...\n');

var time0 = Date.now ();
if (includeHTML) fs.writeFileSync(htmlFile, '<pre style="word-wrap: break-word; white-space: pre; display: block; line-height: 0.8em; letter-spacing: 1.9px;">\n');

if (includeHTML) console.log ('    HTML file is included.');
console.log ('    dimensions: ' + width + 'x' + height);
console.log ('    iterations: ' + iterations + ' per pixel\n');
console.log ('    escape mag: ' + maxMagnitude);
console.log ('          xmin: ' + xmin);
console.log ('          xmax: ' + xmax);

// Internal values calculated from manipulated values above
var xWidth = Math.abs (xmin - xmax),
	yHalfHeight = xWidth * height / width / 2;

// ymin and ymax are calculated from the ycenter to avoid skewing the image for the arbitrary
// width and height values
var ymin = ycenter - yHalfHeight,
	ymax = ycenter + yHalfHeight;

console.log ('          ymin: ' + ymin);
console.log ('          ymax: ' + ymax + '\n\n');

maxMagnitude *= maxMagnitude;

// Used for animation purposes
var working = ['⠋', '⠙', '⠚', '⠓'],
	icon = 0,
	interval = 100, // milliseconds
	tIcon0 = Date.now ();

// PNG containing stream
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

			png.data[idx]     = 0x0;  // red
			png.data[idx + 1] = 0x0;  // green
			png.data[idx + 2] = 0x0;  // blue
			png.data[idx + 3] = 0xff; // alpha
		}

		else {
			if (includeHTML) imageRow += calculatePixel (mu);

			png.data[idx]     = Math.round (mu * 0xff); // red
			png.data[idx + 1] = Math.round (mu * 0xff); // green
			png.data[idx + 2] = Math.round (mu * 0xff); // blue
			png.data[idx + 3] = 0xff; // alpha
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

// Clear the previously logged line to log the final percent and time of execution
readline.moveCursor (process.stdout, 0, -1);
readline.clearLine (process.stdout, 0);

png.pack ().pipe (fs.createWriteStream (pngFile)).on ('error', function (err) {
	console.log ('\nThere was an error writing the PNG file');
	console.log (err);
});

console.log('    100.000% - ' + (Math.round ((Date.now () - time0)) / 1000) + 's');
console.log ('\nThe file' + (includeHTML? 's' : '') + ' "' +
	pngFile + '"' + (includeHTML? ' and "' + htmlFile + '"' +
		' were' : ' was') + ' successfully saved in ' + __dirname);
