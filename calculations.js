// Necessary modules to make the image
const fs  = require ('fs'),
      colors = require ('colors'),
      PNG = require ('pngjs').PNG;

const RGBA_COLOR_TYPE = 6,
      UPDATE_INTERVAL = 100,
      GET_ASCII_RATHER_THAN_RGBA = true;


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

// Program values and objects
var includeHTML = false,
    htmlFile,
    pngFile,
    options,
    png,
    cg,
    isWindows;


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
    isWindows = environment.isWindows;

    console.log ('             width: '.cyan + width + 'px');
    console.log ('            height: '.cyan + height + 'px');
    console.log ('              xmin: '.cyan + xmin);
    console.log ('              xmax: '.cyan + xmax);
    console.log ('              ymin: '.cyan + ymin);
    console.log ('              ymax: '.cyan + ymax);
    console.log ('      maxMagnitude: '.cyan + maxMagnitude);
    console.log ('        iterations: '.cyan + iterations + ' per pixel');
    console.log ('          includeR: '.cyan + '0x' + includeR.toString (16));
    console.log ('          includeG: '.cyan + '0x' + includeG.toString (16));
    console.log ('          includeB: '.cyan + '0x' + includeB.toString (16));
    console.log ('          includeA: '.cyan + '0x' + includeA.toString (16));
    console.log ('    escapeGradient: '.cyan + '[' + escapeGradient + ']');

    // Save the new cursor location if on Windows to avoid clusterfuck of logging
    if (isWindows) process.stdout.write ('\n\n\033[s');
    else console.log ('\n');
    process.send ([100, 'startLog']);

    htmlFile = environment.htmlFile;
    pngFile = environment.pngFile;
    options = {
        width: width,
        height: height,
        colorType: RGBA_COLOR_TYPE,
        filterType: -1
    };

    png = new PNG (options);
    cg = new ColorGradient (escapeGradient);

    generateMandelbrotImage ();
});

// Does the mandelbrot calculations and saves the image
var startTime = 0,
    htmlFailed = false;
function generateMandelbrotImage () {
    // Save the starting time for updating the main program periodically
    startTime = Date.now ();

    // Square the magnitude for faster escape check
    maxMagnitude *= maxMagnitude;

    // Generate the HTML file, if wanted
    if (includeHTML) {
        var css = [
            'word-wrap: break-word;',
            'white-space: pre;',
            'display: block;',
            'line-height: 0.8em;',
            'letter-spacing: 1.9px'
        ];

        try {
            fs.writeFileSync(htmlFile, '<pre style="' + css.join (' ') + '">\n');
        } catch (e) {
            htmlFailed = true;
        }
    }

    // Main maindelbrot loop
    for (var j = 0; j < height; j++) {
        var imageRow = '',
            py = j / height,
            y0 = (1 - py) * ymin + py * ymax,
            mu;

        for (var i = 0; i < width; i++) {
            var px = i / width,
                x0 = (1 - px) * xmin + px * xmax;

            var xi = x0,
                yi = y0,
                k;

            for (k = 0; k < iterations; k++) {
                var x_i = xi,
                    y_i = yi;

                xi = x_i * x_i - y_i * y_i + x0;
                yi = 2 * x_i * y_i + y0;

                // Break if bigger than the maximum value allowed for magnitude
                if ((xi * xi + yi * yi) > maxMagnitude) break;
            }

            // Calculate k smooth for smooth coloration of the mandelbrot image, then plot the color
            var val = xi * xi + yi * yi;
            mu = k + 1 - Math.log (0.5 * Math.log (val)) / Math.log (2);
            mu /= iterations;

            // Append the new pixel to the raw buffer
            var idx = 4 * (width * j + i);
            if (k == iterations) {
                if (includeHTML) imageRow += '#';

                png.data[idx]     = includeR;  // red
                png.data[idx + 1] = includeG;  // green
                png.data[idx + 2] = includeB;  // blue
                png.data[idx + 3] = includeA;  // alpha
            }

            else {
                if (includeHTML) imageRow += cg.rgbaAt (mu, GET_ASCII_RATHER_THAN_RGBA);

                var rgbaColor = cg.rgbaAt (mu);

                png.data[idx]     = rgbaColor[0];  // red
                png.data[idx + 1] = rgbaColor[1];  // green
                png.data[idx + 2] = rgbaColor[2];  // blue
                png.data[idx + 3] = rgbaColor[3];  // alpha
            }

            // Send update information to mandelbrot.js if time is good
            if (Date.now () - startTime >= UPDATE_INTERVAL) {
                process.send ([100 * (py + px / height), isNaN (mu) || mu > 1? 1 : mu]);
                startTime = Date.now ();
            }
        }

        if (includeHTML && !htmlFailed) {
            try {
                fs.appendFileSync (htmlFile, imageRow + '\n');
            } catch (e) {
                htmlFailed = true;
            }
        }
    }

    // Close the HTML tag of the ascii file if necessary
    if (includeHTML && !htmlFailed) {
        try {
            fs.appendFileSync (htmlFile, '</pre>');
        } catch (e) {
            htmlFailed = true;
        }
    }

    // Tell the main process that packing will begin
    process.send ([100, 'packing']);

    // Pack and wrap it up
    png.pack ().pipe (fs.createWriteStream (pngFile)).on ('error', function (err) {
        process.send ([err, 'error']);
    }).on ('finish', function () {
        // Let the parent process know that the HTML file experienced some error when being created
        if (includeHTML)
            process.send ([100, 'finish:' + htmlFailed]);
        
        // Let the parent know that everything worked as expected
        else
            process.send ([100, 'finish']);
    });
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
