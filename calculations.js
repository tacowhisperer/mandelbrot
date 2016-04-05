// Necessary modules to make the image
var fs  = require ('fs'),
    colors = require ('colors'),
	PNG = require ('pngjs').PNG;

// Mandelbrot values
var width,
	height,
	
	xmin,
	xmax,
	ymin,
	ymax,
	maxMagnitude,
	iterations,

	includeR,
	includeG,
	includeB,
	includeA,

	escapeGradient;

// Program values
var includeHTML = false,
	htmlFile,
	pngFile;

// Initialize the variables and start the calculations
process.on ('message', function (environment) {
	width = environment.width;
	height = environment.height;

	xmin = environment.xmin;
	xmax = environment.xmax;
	ymin = environment.ymin;
	ymax = environment.ymax;
	maxMagnitude = environment.maxMagnitude;
	iterations = environment.iterations;

	includeR = environment.includeR;
	includeG = environment.includeG;
	includeB = environment.includeB;
	includeA = environment.includeA;

	escapeGradient = environment.escapeGradient;

    console.log ('             width: '.cyan + width + 'px');
    console.log ('            height: '.cyan + height + 'px');
    console.log ('              xmin: '.cyan + xmin);
    console.log ('              xmax: '.cyan + xmax);
    console.log ('              ymin: '.cyan + ymin);
    console.log ('              ymax: '.cyan + ymax);
    console.log ('      maxMagnitude: '.cyan + maxMagnitude);
    console.log ('        iterations: '.cyan + iterations + ' per pixel');
    console.log ('          includeR: '.cyan + includeR);
    console.log ('          includeG: '.cyan + includeG);
    console.log ('          includeB: '.cyan + includeB);
    console.log ('          includeA: '.cyan + includeA);
	console.log ('    escapeGradient: '.cyan + '[' + escapeGradient + ']');
    console.log ('\n');

	htmlFile = environment.htmlFile;
	pngFile = environment.pngFile;

	generateMandelbrotImage ();
});

// Does the mandelbrot calculations and saves the image
function generateMandelbrotImage () {
	// Temporarily simulate generation for debugging re_mandelbrot.js
	var i = 0,
		n = 10;

	var int = setInterval (function () {
		if ((i += 0.1 * Math.random ()) < n) {
			process.send ([100 * i / n, 1]);
		}

		else {
            process.send ([100, 1]);
            clearInterval (int);
        }
	}, 33);
}

// Object used to calculate color gradient from a percent value v element of [0, 1] (✓✓)
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
    this.rgbaAt = function (v, isASCII) {
        if (isASCII) {
            if      (v < 0.0333) 
                return ' ';

            else if (v < 0.0666) 
                return '`';

            else if (v < 0.1000) 
                return '.';

            else if (v < 0.1333) 
                return '-';

            else if (v < 0.1666) 
                return "'";

            else if (v < 0.2000) 
                return '^';

            else if (v < 0.2333) 
                return '"';

            else if (v < 0.2666) 
                return ':';

            else if (v < 0.3000) 
                return '!';

            else if (v < 0.3333) 
                return '+';

            else if (v < 0.3666) 
                return '?';

            else if (v < 0.4000) 
                return '[';

            else if (v < 0.4333) 
                return '|';

            else if (v < 0.4666) 
                return 't';

            else if (v < 0.5000) 
                return 'j';

            else if (v < 0.5333) 
                return 'u';

            else if (v < 0.5666) 
                return 'x';

            else if (v < 0.6000) 
                return 'z';

            else if (v < 0.6333) 
                return 'U';

            else if (v < 0.6666) 
                return 'O';

            else if (v < 0.7000) 
                return 'Y';

            else if (v < 0.7333) 
                return 'Z';

            else if (v < 0.7666) 
                return 'X';

            else if (v < 0.8000) 
                return 'p';

            else if (v < 0.8333) 
                return 'b';

            else if (v < 0.8666) 
                return '%';

            else if (v < 0.9000) 
                return 'k';

            else if (v < 0.9333) 
                return '@';

            else if (v < 0.9666) 
                return 'M';

            else 
                return '#';
        }

        else {
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
