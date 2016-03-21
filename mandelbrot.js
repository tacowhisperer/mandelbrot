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

    escapeGradient = [];

// Used to prevent excessively long terminal logs
var cRet = '\r',
    isWindows = false;
if (process.platform.match (/^win/i)) {
    cRet = '';
    isWindows = true;
}


// Gracefully exit node by letting the user know that the image might be corrupted
process.on ('SIGINT', function () {
    console.log ('\nThe current process has been terminated. Note that the files might be corrupted.');
    process.exit (0);
});


// Process the arguments fed
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

    else if (process.argv[i].match (/^--?includeRGBA:[0-9a-f]{8}$/i)) {
        var components = process.argv[i].replace (/^--?includeRGBA:/i, '').match (/[0-9a-f]{2}/gi);
        includeR = +('0x' + components[0]);
        includeG = +('0x' + components[1]);
        includeB = +('0x' + components[2]);
        includeA = +('0x' + components[3]);
    }

    else if (process.argv[i].match (/^--?escapeGradient:\[[0-9a-f]{8}(,[0-9a-f]{8})*\]$/i)) {
        escapeGradient = process.argv[i].replace (/^--?escapeGradient:/i, '').match (/[0-9a-f]{8}/gi);
    }

    else
        console.log ('Unknown argument: "'.yellow + process.argv[i].red + '"'.yellow);
}

// Hot fix for negative y-center movement
ycenter *= -1;

var htmlFile = fileName? fileName + '.html' : 'mandelbrot.html',
    pngFile  = fileName? fileName + '.png' : 'mandelbrot.png';

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

// Save the cursor position if on Windows because Windows sucks
if (isWindows) process.stdout.write ('\033[s');


// Square the magnitude to avoid square rooting when checking the escape magnitude
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

// Calculates the color at a percentage given a color gradient array of strings
var cg = new ColorGradient (escapeGradient);


// Begin mandelbrot calculation loops
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
            if (includeHTML) imageRow += asciiShadeAt (mu);

            var rgbaColor = cg.rgbaAt (mu);

            png.data[idx]     = rgbaColor[0]; // red
            png.data[idx + 1] = rgbaColor[1]; // green
            png.data[idx + 2] = rgbaColor[2]; // blue
            png.data[idx + 3] = rgbaColor[3]; // alpha
        }

        // Force update percentage if time to update loading icon
        if (Date.now () - tIcon0 >= interval) {
            var percent = Math.round(100 * 1000 * (py + px / height)) / 1000 + '';
            while (percent.length < 6) percent += '0';
            percent += '%';

            icon = (icon + 1) % working.length;
            tIcon0 = Date.now ();

            // Refresh line rather than appending to it in the console
            if (isWindows) process.stdout.write ('\0338');
            readline.clearLine (process.stdout, 0);
            process.stdout.write (('    ' + working[icon] + '     ' + percent + cRet).yellow);
        }
    }

    if (includeHTML) fs.appendFileSync (htmlFile, imageRow + '\n');

    // Update the new percentage to the screen on every 3rd row to avoid unnecessary performance reduction
    if (!(j % 3)) {
        var percent = Math.round(100 * 1000 * (j / height + i / width / height)) / 1000 + '';
        while (percent.length < 6) percent += '0';
        percent += '%';

        // Update loading icon if interval time has passed
        if (Date.now () - tIcon0 >= interval) {
            icon = (icon + 1) % working.length;
            tIcon0 = Date.now ();
        }

        if (isWindows) process.stdout.write ('\0338');
        readline.clearLine (process.stdout, 0);
        process.stdout.write (('    ' + working[icon] + '     ' + percent + cRet).yellow);
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

    if (isWindows) process.stdout.write ('\0338');
    readline.clearLine (process.stdout, 0);
    process.stdout.write (('    ' + working[icon++ % working.length] + '     Flushing data to disk' + dots + cRet).yellow);

}, interval);

// Log that packing PNG data will begin
if (isWindows) process.stdout.write ('\0338');
readline.clearLine (process.stdout, 0);
process.stdout.write (('    ⌛   Packing raw PNG data. Please wait!' + cRet).yellow);

// Pipe the generated PNG information into the final output write stream
png.pack ().pipe (fs.createWriteStream (pngFile)).on ('error', function (err) {
    if (isWindows) process.stdout.write ('\0338');
    readline.clearLine (process.stdout, 0);
    console.log ('    ✖'.red);
    console.log (('\nThere was an error writing the PNG file.').red);
    console.log (('' + err).red);

    if (includeHTML) 
        console.log (('\nHowever, the HTML file "' + htmlFile + '" was successfully saved in ' + __dirname).yellow);
}).on ('finish', function () {
    // Stop the final animation from running
    clearInterval (finalAnimationInterval);

    // Clear the previously logged line to log the final percent and time of execution
    if (isWindows) process.stdout.write ('\0338');
    readline.clearLine (process.stdout, 0);

    var exeTimeInSeconds = (Date.now () - time0) / 1000,
        exeTimeInMinutes = exeTimeInSeconds / 60,
        exeTimeInHours   = exeTimeInMinutes / 60,
        exeTimeInDays    = exeTimeInHours / 24,

        s = ('' + (Math.round (1000 * exeTimeInSeconds) / 1000) % 60),
        m = (exeTimeInMinutes % 60) >> 0,
        h = (exeTimeInHours % 24) >> 0,
        d = exeTimeInDays >> 0;

    // Shorten any floating point error
    var fErr = s.match (/\.\d{4}/);
    if (fErr) {
        var sInt = s.match (/^\d+\./)[0];

        if (+fErr[0].charAt (4) > 4) {
            var lastChar = +fErr[0].charAt (3);
            lastChar++;
            s = sInt + fErr[0].charAt (1) + fErr[0].charAt (2) + lastChar;
        }

        else
            s = sInt + fErr[0].charAt (1) + fErr[0].charAt (2) + fErr[0].charAt (3);
    }

    // Concatenate the total time string for console.log
    var timeString = (d? d + 'd ' : '') + (h? h + 'h ' : '') + (m? m + 'm ' : '') + s + 's (' +
        Math.round (1000 * exeTimeInSeconds) + 'ms)';

    console.log (('    100.000% - ' + timeString).green);
    console.log (('\nThe file' + (includeHTML? 's' : '') + ' "' +
        pngFile + '"' + (includeHTML? ' and "' + htmlFile + '"' +
            ' were' : ' was') + ' successfully saved in ' + __dirname).green);
});

// Used to map the ascii corresponding to a shade value range for the HTML file
function asciiShadeAt (v) {
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

// Object used to calculate color gradient from a percent value v element of [0, 1]
function ColorGradient (colorsArray) {
    // Index values
    var I = 0,
        RED = I++,
        L_STAR = RED,

        GREEN = I++,
        A_STAR = GREEN,

        BLUE = I++,
        B_STAR = BLUE,

        ALPHA = I++;

    // Always have at least one color to avoid division by 0
    if (!colorsArray.length)
        colorsArray = ['000000ff', 'ffffffff'];

    else if (colorsArray.length == 1)
        colorsArray = ['000000ff', colorsArray[0]];

    
    // Convert each color string to color arrays for faster manipulation
    for (var i = 0; i < colorsArray.length; i++)
        colorsArray[i] = colorsArray[i].match (/[0-9a-f]{2}/gi).map (function (s) {return +('0x' + s);});

    var n = colorsArray.length,
        interval = 1 / n,
        colors = colorsArray;


    // Returns the color array found between a specific interval
    this.rgbaAt = function (v) {
        for (var i = 1; i <= n; i++) {
            if (i < n && v < i * interval) {
                // Calculate the interpolation through CIE-L*ab color space
                var a = (i - 1) / n,
                    b = i / n,
                    q = (v - a) / (b - a),
                    p = 1 - q,
                    rgba0 = colors[i - 1],
                    rgba1 = colors[i],

                    sL = x2L (r2X (rgba0)),
                    eL = x2L (r2X (rgba1)),

                    iL = p * sL[L_STAR] + q * eL[L_STAR],
                    ia = p * sL[A_STAR] + q * eL[A_STAR],
                    ib = p * sL[B_STAR] + q * eL[B_STAR],
                    al = p * rgba0[ALPHA] + q * rgba1[ALPHA];

                return x2R (l2X ([iL, ia, ib, al]));
            }

            else if (i == n) {
                var a = (i - 1) / n,
                    b = 1,
                    q = (v - a) / (b - a),
                    p = 1 - q,
                    rgba0 = colors[i - 1],
                    rgba1 = [includeR, includeG, includeB, includeA],

                    sL = x2L (r2X (rgba0)),
                    eL = x2L (r2X (rgba1)),

                    iL = Math.round (p * sL[L_STAR] + q * eL[L_STAR]),
                    ia = Math.round (p * sL[A_STAR] + q * eL[A_STAR]),
                    ib = Math.round (p * sL[B_STAR] + q * eL[B_STAR]),
                    al = Math.round (p * rgba0[ALPHA] + q * rgba1[ALPHA]);

                return x2R (l2X ([iL, ia, ib, al]));
            }
        }

        throw 'The value "' + v + '" was rejected from all intervals from 0-' + interval + ' to ' + ((n - 1) / n) + '-1';
    };

    // Returns the array corresponding to the XYZ values of the input RGB array
    function r2X (rgb) {
        var R = rgb[0] / 255,
            G = rgb[1] / 255,
            B = rgb[2] / 255;

        R = 100 * (R > 0.04045? Math.pow ((R + 0.055) / 1.055, 2.4) : R / 12.92);
        G = 100 * (G > 0.04045? Math.pow ((G + 0.055) / 1.055, 2.4) : G / 12.92);
        B = 100 * (B > 0.04045? Math.pow ((B + 0.055) / 1.055, 2.4) : B / 12.92);

        var X = R * 0.4124 + G * 0.3576 + B * 0.1805,
            Y = R * 0.2126 + G * 0.7152 + B * 0.0722,
            Z = R * 0.0193 + G * 0.1192 + B * 0.9505;

        return [X, Y, Z, rgb[3]];
    }

    // Returns the array corresponding to the CIE-L*ab values of the input XYZ array
    function x2L (xyz) {
        var X = xyz[0] / 95.047,
            Y = xyz[1] / 100,
            Z = xyz[2] / 108.883,
            T = 1 / 3,
            K = 16 / 116;

        X = X > 0.008856? Math.pow (X, T) : (7.787 * X) + K;
        Y = Y > 0.008856? Math.pow (Y, T) : (7.787 * Y) + K;
        Z = Z > 0.008856? Math.pow (Z, T) : (7.787 * Z) + K;

        var L = (116 * Y) - 16,
            a = 500 * (X - Y),
            b = 200 * (Y - Z);

        return [L, a, b, xyz[3]];
    }

    // Returns the array corresponding to the XYZ values of the input CIE-L*ab array
    function l2X (Lab) {
        var Y = (Lab[0] + 16) / 116,
            X = Lab[1] / 500 + Y,
            Z = Y - Lab[2] / 200,
            K = 16 / 116;

        X = 95.047 * ((X * X * X) > 0.008856? X * X * X : (X - K) / 7.787);
        Y = 100 * ((Y * Y * Y) > 0.008856? Y * Y * Y : (Y - K) / 7.787);
        Z = 108.883 * ((Z * Z * Z) > 0.008856? Z * Z * Z : (Z - K) / 7.787);

        return [X, Y, Z, Lab[3]];
    }

    // Returns the array corresponding to the RGB values of the input XYZ array
    function x2R (xyz) {
        var X = xyz[0] / 100,
            Y = xyz[1] / 100,
            Z = xyz[2] / 100,
            T = 1 / 2.4;

        var R = X *  3.2406 + Y * -1.5372 + Z * -0.4986,
            G = X * -0.9689 + Y *  1.8758 + Z *  0.0415,
            B = X *  0.0557 + Y * -0.2040 + Z *  1.0570;

        R = 255 * (R > 0.0031308? 1.055 * Math.pow (R, T) - 0.055 : 12.92 * R);
        G = 255 * (G > 0.0031308? 1.055 * Math.pow (G, T) - 0.055 : 12.92 * G);
        B = 255 * (B > 0.0031308? 1.055 * Math.pow (B, T) - 0.055 : 12.92 * B);

        return [R, G, B, xyz[3]];
    }
}
