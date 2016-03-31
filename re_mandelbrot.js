// Load the required Node.js modules (✓)
var fs       = require ('fs'),
    readline = require ('readline'),
    colors   = require ('colors'),
    cp       = require ('child_process');

// Holds the mandelbrot calculating child process
var mandelbrotCalculatingChildProcess = null;

// Stores settings for the program (✓)
var SETTINGS_FILE = 'mandelbrot.settings';

// Differentiate carriage return based on OS (✓)
var cRet      = '\r',
    isWindows = false;

// Windows is typically win32 or win64 (✓)
if (process.platform.match (/^win/i)) { 
    cRet      = '',
    isWindows = true;
}


// Animate the initial check message
var ANIMATION_INT = 100, // ms
    checkAnim =  ['Checking for settings', [['', '.', '..', '...'], 1, 0]],
    checkLA = new ConsoleLineAnimation (checkAnim, ANIMATION_INT);

// Used to store input from stdin (✓)
var answer = '',
    open = true,
    stdinCallback = function () {console.log ('No callback specified.'.red)};

// Handles input coming from stdin. \n and \n equivalents are used as the cutoff (✓ assuming that "data" fires each time on key press)
process.stdin.on ('data', function (data) {
    // Assuming that 'data' fires on keypress, so hang tight for bugs
    var char = data.toString ('utf8');

    if (open) { 
        // Stop receiving text on enter
        if (char == '\n' || char == '\r' || char == '\r\n') {
            open = false;
            stdinCallback ();
        }

        else if (char.match (/\n/)) 
            answer += char.match (/[^\n]+/) && char.match (/[^\n]+/)[0] || '';

        // Append the character otherwise
        else answer += char;
    }
});



// Check for settings stored in a previous session (✓)
checkForSettings ();

// Called to re-check for settings (✓)
function checkForSettings () {
    checkLA.log ();
    fs.readFile (SETTINGS_FILE, readSettingsHandler);
}

// Handler for checking the stored settings, if any (✓ with underlying assumptions)
function readSettingsHandler (err, settings) {
    // Stop the animation of the little message that says "checking for settings..."
    checkLA.stop ();

    // No previous settings were found (✓ assuming that stdin "resume" and "pause" methods exist and behave as expected)
    if (err && err.code == 'ENOENT') {
        console.log ('No previous settings were found.'.yellow);

        // Open the floodgates to answer the question
        open = true;
        stdinCallback = createNewSettings;
        process.stdout.write ('Would you like to save your settings? (Y/N then Enter twice): ');
        process.stdin.resume ();
    }

    // A weird, unexpected error was encountered, so just end the program (✓)
    else if (err) {
        console.log (('The error "' + err.code + '" was encountered').red);
        console.log (('' + err).red);
    }

    // Manipulate the save settings buffer as specified and continue with mandelbrot calculations afterward (✓ with underlying assumptions)
    else {
        // Pause stdin to avoid overwriting console logs
        process.stdin.pause ();

        var SIGNATURE_LEN           = SAVE_FILE_SIGNATURE.length,
            MIN_EXPECTED_DATA_BYTES = 50 + SIGNATURE_LEN;

        var validFile = true;

        // The file cannot be less than 50 + SIGNATURE_LEN bytes unless do not use settings
        if (typeof settings[SIGNATURE_LEN] != 'undefined') 
            useStoredSettings = settings[SIGNATURE_LEN] >> 7 & 0x1;

        else
            useStoredSettings = false;

        if (useStoredSettings && settings.length < MIN_EXPECTED_DATA_BYTES)
            validFile = false; 

        // Check and read the file for everything if it's still considered valid
        if (validFile && useStoredSettings) {
            // Check the save file SIGNATURE_LEN (✓)
            for (var i = 0; i < SIGNATURE_LEN; i++) {
                if (settings[i] != SAVE_FILE_SIGNATURE[i]) {
                    validFile = false;
                    break;
                }
            }

            // Read the stored data if it's still considered a valid file (✓ assuming all systems are little-endian)
            // STORAGE IS LITTLE-ENDIAN
            if (validFile && settings.length != SIGNATURE_LEN + 1) {
                // Reload the boolean flags
                booleans = settings[SIGNATURE_LEN];
                useStoredSettings = booleans >> 7 & 0x1;
                includeHTML = booleans >> 6 & 0x1;
                debugETA = booleans >> 5 & 0x1;

                // Reload image width
                widthBuff[0] = settings[SIGNATURE_LEN + 1];
                widthBuff[1] = settings[SIGNATURE_LEN + 2];
                widthBuff[2] = settings[SIGNATURE_LEN + 3];
                widthBuff[3] = settings[SIGNATURE_LEN + 4];
                width = widthView[0];

                // Reload image height
                heightBuff[0] = settings[SIGNATURE_LEN + 5];
                heightBuff[1] = settings[SIGNATURE_LEN + 6];
                heightBuff[2] = settings[SIGNATURE_LEN + 7];
                heightBuff[3] = settings[SIGNATURE_LEN + 8];
                height = heightView[0];

                // Reload xmin
                xminBuff[0] = settings[SIGNATURE_LEN + 9];
                xminBuff[1] = settings[SIGNATURE_LEN + 10];
                xminBuff[2] = settings[SIGNATURE_LEN + 11];
                xminBuff[3] = settings[SIGNATURE_LEN + 12];
                xminBuff[4] = settings[SIGNATURE_LEN + 13];
                xminBuff[5] = settings[SIGNATURE_LEN + 14];
                xminBuff[6] = settings[SIGNATURE_LEN + 15];
                xminBuff[7] = settings[SIGNATURE_LEN + 16];
                xmin = xminView[0];

                // Reload xmax
                xmaxBuff[0] = settings[SIGNATURE_LEN + 17];
                xmaxBuff[1] = settings[SIGNATURE_LEN + 18];
                xmaxBuff[2] = settings[SIGNATURE_LEN + 19];
                xmaxBuff[3] = settings[SIGNATURE_LEN + 20];
                xmaxBuff[4] = settings[SIGNATURE_LEN + 21];
                xmaxBuff[5] = settings[SIGNATURE_LEN + 22];
                xmaxBuff[6] = settings[SIGNATURE_LEN + 23];
                xmaxBuff[7] = settings[SIGNATURE_LEN + 24];
                xmax = xmaxView[0];

                // Reload ycenter
                ycenterBuff[0] = settings[SIGNATURE_LEN + 25];
                ycenterBuff[1] = settings[SIGNATURE_LEN + 26];
                ycenterBuff[2] = settings[SIGNATURE_LEN + 27];
                ycenterBuff[3] = settings[SIGNATURE_LEN + 28];
                ycenterBuff[4] = settings[SIGNATURE_LEN + 29];
                ycenterBuff[5] = settings[SIGNATURE_LEN + 30];
                ycenterBuff[6] = settings[SIGNATURE_LEN + 31];
                ycenterBuff[7] = settings[SIGNATURE_LEN + 32];
                ycenter = ycenterView[0];

                // Reload maxMagnitude
                maxMagnitudeBuff[0] = settings[SIGNATURE_LEN + 33];
                maxMagnitudeBuff[1] = settings[SIGNATURE_LEN + 34];
                maxMagnitudeBuff[2] = settings[SIGNATURE_LEN + 35];
                maxMagnitudeBuff[3] = settings[SIGNATURE_LEN + 36];
                maxMagnitudeBuff[4] = settings[SIGNATURE_LEN + 37];
                maxMagnitudeBuff[5] = settings[SIGNATURE_LEN + 38];
                maxMagnitudeBuff[6] = settings[SIGNATURE_LEN + 39];
                maxMagnitudeBuff[7] = settings[SIGNATURE_LEN + 40];
                maxMagnitude = maxMagnitudeView[0];

                // Reload iterations
                iterationsBuff[0] = settings[SIGNATURE_LEN + 41];
                iterationsBuff[1] = settings[SIGNATURE_LEN + 42];
                iterationsBuff[2] = settings[SIGNATURE_LEN + 43];
                iterationsBuff[3] = settings[SIGNATURE_LEN + 44];
                iterations = iterationsView[0];

                // Reload includeRGBA
                includeRGBA[0] = includeR = settings[SIGNATURE_LEN + 45];
                includeRGBA[1] = includeG = settings[SIGNATURE_LEN + 46];
                includeRGBA[2] = includeB = settings[SIGNATURE_LEN + 47];
                includeRGBA[3] = includeA = settings[SIGNATURE_LEN + 48];

                // Reload escape gradient
                // Check if there even is a file name to reload (✓ with assumption that escape gradient stores strings, not number values)
                if (typeof settings[SIGNATURE_LEN + 51] != 'undefined') {
                    // Used to find the end of the escape gradient
                    var endOfEscapeGradient = 0;

                    // Push all values belonging to the escape gradient array
                    escapeGradientBuffArr.reset ().push ('['.charCodeAt (0));
                    for (var i = SIGNATURE_LEN + 50, f = false; i < settings.length; i += 5) {
                        // signifies that another value is coming
                        if (f && settings[i] == ','.charCodeAt (0)) {
                            if (typeof settings[i + 4] != 'undefined') {
                                escapeGradientBuffArr.push (settings[i + 1])
                                                     .push (settings[i + 2])
                                                     .push (settings[i + 3])
                                                     .push (settings[i + 4]);
                            }

                            else {
                                console.log ('The save file has been unexpectedly truncated!'.red);
                                console.log ('Unusual behavior may occur due to premature file termination.'.yellow);
                                endOfEscapeGradient = i;
                                break;
                            }
                        }

                        // Signifies the end of the escape gradient array
                        else if (f && settings[i] == ']'.charCodeAt (0)) {
                            escapeGradientBuffArr.push (']'.charCodeAt (0));
                            endOfEscapeGradient = i;
                            break;
                        }

                        // Haven't gone past the first round of RGBA
                        else if (!f) {
                            if (typeof settings[i + 3] != 'undefined') {
                                escapeGradientBuffArr.push (settings[i])
                                                     .push (settings[i + 1])
                                                     .push (settings[i + 2])
                                                     .push (settings[i + 3]);
                            }

                            else {
                                console.log ('The save file has been unexpectedly truncated!'.red);
                                console.log ('Unusual behavior may occur due to premature file termination.'.yellow);
                                endOfEscapeGradient = i;
                                break;
                            }
                            
                            f = true;
                        }

                        // The file was somehow truncated
                        else {
                            console.log ('The save file has been unexpectedly truncated!'.red);
                            console.log ('Unusual behavior may occur due to premature file termination.'.yellow);
                            endOfEscapeGradient = i;
                            break;
                        }
                    }

                    // Convert the BufferArray of utf8 bytes to an array useable by the ColorGradient object
                    escapeGradient = escapeGradientBuffArr.buffer ()
                                                          .toString ('utf8')
                                                          .match (/[0-9a-f]{8}/gi);
                    
                    // Store any remaining bytes as the fileName
                    while (typeof settings[++endOfEscapeGradient] != 'undefined')
                        fileNameBuffArr.push (settings[endOfEscapeGradient]);

                    fileName = fileNameBuffArr.buffer ().toString ('utf8');
                    fileName = fileName.length? fileName.replace (/\/|\?|<|>|\\|:|\*|\||"/g, '') : 'mandelbrot';
                }

                // There is no file name to reload (✓)
                else {
                    escapeGradient = DEFAULT_ESCAPEGRADIENT.toString ('utf8')
                                                           .replace (/^\[|\]$/g, '')
                                                           .match (/[0-9a-f]{8}/gi);

                    fileName = 'mandelbrot';
                }
            }
        }

        // Load default values if do not use stored settings or the file is unexpectedly long
        else {
            width  = DEFAULT_WIDTH;
            height = DEFAULT_HEIGHT;
            
            xmin         = DEFAULT_XMIN,
            xmax         = DEFAULT_XMAX,
            ycenter      = DEFAULT_YCENTER,
            maxMagnitude = DEFAULT_MAXMAGNITUDE,
            iterations   = DEFAULT_ITERATIONS,

            includeR = DEFAULT_INCLUDE_R,
            includeG = DEFAULT_INCLUDE_G,
            includeB = DEFAULT_INCLUDE_B,
            includeA = DEFAULT_INCLUDE_A,

            escapeGradient = DEFAULT_ESCAPEGRADIENT.toString ('utf8')
                                                   .replace (/^\[|\]$/g, '')
                                                   .match (/[0-9a-f]{8}/gi);
        }

        // Begin calculating the mandelbrot set
        updateSavedSettingsWithArgs ();
    }
}

// Answer the question of whether or not the user would like to save their settings
function createNewSettings () {
    // Clear the two previous logs (✓)
    if (isWindows) process.stdout.write ('\0338');
    else process.stdout.write ('\r');
    readline.clearLine (process.stdout, 0);
    readline.moveCursor (process.stdout, 0, -1);
    readline.clearLine (process.stdout, 0);
    if (isWindows) process.stdout.write ('\033[s');

    // Create a new save file with default values because user wants to save settings (✓)
    if (answer.match (/^y/i)) {
        booleans      = DEFAULT_BOOLEANS;
        widthView[0]  = DEFAULT_WIDTH;
        heightView[0] = DEFAULT_HEIGHT;
        
        xminView[0]         = DEFAULT_XMIN;
        xmaxView[0]         = DEFAULT_XMAX;
        ycenterView[0]      = DEFAULT_YCENTER;
        maxMagnitudeView[0] = DEFAULT_MAXMAGNITUDE;
        iterationsView[0]   = DEFAULT_ITERATIONS;

        // Values are numbers, not strings
        includeRGBA[0] = DEFAULT_INCLUDE_R;
        includeRGBA[1] = DEFAULT_INCLUDE_G;
        includeRGBA[2] = DEFAULT_INCLUDE_B;
        includeRGBA[3] = DEFAULT_INCLUDE_A;

        escapeGradient = DEFAULT_ESCAPEGRADIENT.toString ('utf8')
                                               .replace (/^\[|\]$/g, '')
                                               .match (/[0-9a-f]{8}/gi);

        saveUserSettings (false, function () {
            console.log ('Settings file successfully created'.green);

            setTimeout (function () {
                // Clear the previous log before checking for settings again
                if (isWindows) process.stdout.write ('\0338');
                else process.stdout.write ('\r');
                readline.clearLine (process.stdout, 0);

                checkForSettings ();
            }, 1000);
        });
    }

    // (✓)
    else if (answer.match (/^n/i)) {
        saveUserSettings (true, function () {
            console.log ('Reduced settings file successfully created'.green);

            setTimeout (function () {
                // Clear the previous log before checking for settings again
                if (isWindows) process.stdout.write ('\0338');
                else process.stdout.write ('\r');
                readline.clearLine (process.stdout, 0);

                checkForSettings ();
            }, 1000);
        });
    }

    // (✓)
    else {
        console.log (('Your answer, "' + answer + + '", is not Y/N.').red);
        setTimeout (function () {
            // Clear the previous log before checking for settings again
            if (isWindows) process.stdout.write ('\0338');
            else process.stdout.write ('\r');
            readline.clearLine (process.stdout, 0);

            checkForSettings ();
        }, 1000);
    }
}

// Update the current session with arguments provided, and save them if the user wants to (✓)
function updateSavedSettingsWithArgs () {
    // Arguments fed by the user start at index 2 in Node.js (✓)
    for (var i = 2; i < process.argv.length; i++) {

        // Whether to save settings or not (✓)
        if (process.argv[i].match (/^--?saveSettings:(y(e|es)?|no?|1|0|t(rue)?|f(alse)?)$/i)) {
            var ans = process.argv[i].replace (/^--?saveSettings:/i, '').toLowerCase ();

            switch (ans) {
                case 'y':
                case 'ye':
                case 'yes':
                case '1':
                case 't':
                case 'true':
                    useStoredSettings = true;
                    booleans = booleans | 0x80;
                    break;

                default:
                    useStoredSettings = false;
                    booleans = booleans & 0x7f;
                    break;
            }
        }

        // Include the HTML file (✓)
        else if (process.argv[i].match (/^--?HTML$/i)) {
            includeHTML = true;
            booleans = booleans | 0x40;
        }

        // Do not include the HTML file (✓)
        else if (process.argv[i].match (/^--?noHTML$/i)) {
            includeHTML = false;
            booleans = booleans & 0xbf;
        }

        // What the output file(s) name should be (✓)
        else if (process.argv[i].match (/^--?filename:/i)) {
            fileName = process.argv[i].replace (/\/|\?|<|>|\\|:|\*|\||"|^--?filename:/gi, '');
            fileNameBuffArr.reset ().mergeBuffer (new Buffer (fileName));
        }

        // The dimensions of the image (✓)
        else if (process.argv[i].match (/^--?size:\d+\D\d+$/i)) {
            var dimensions = process.argv[i].match (/\d+/g);
            width = dimensions[0];
            height = dimensions[1];
            widthView[0] = width;
            heightView[0] = height;
        }

        // The minimum x-value (✓)
        else if (process.argv[i].match (/^--?xmin:\-?\d+\.?\d*$/i)) {
            xmin = +process.argv[i].match (/\-?\d+\.?\d*/)[0];
            xminView[0] = xmin;
        }

        // The maximum x-value (✓)
        else if (process.argv[i].match (/^--?xmax:\-?\d+\.?\d*$/i)) {
            xmax = +process.argv[i].match (/\-?\d+\.?\d*/)[0];
            xmaxView[0] = xmax;
        }

        // The center y-value (✓)
        else if (process.argv[i].match (/^--?ycenter:\-?\d+\.?\d*$/i)) {
            ycenter = +process.argv[i].match (/\-?\d+\.?\d*/)[0];
            ycenterView[0] = ycenter;
        }

        // The escape magnitude (✓)
        else if (process.argv[i].match (/^--?maxMagnitude:\-?\d+\.?\d*$/i)) {
            maxMagnitude = +process.argv[i].match (/\-?\d+\.?\d*/)[0];
            maxMagnitudeView[0] = maxMagnitude;
        }

        // The number of iterations per pixel (✓)
        else if (process.argv[i].match (/^--?iterations:\d+$/i)) {
            iterations = +process.argv[i].match (/\d+/)[0];
            iterationsView[0] = iterations;
        }

        // The RGBA color of pixels that are included in the Mandelbrot Set (✓)
        else if (process.argv[i].match (/^--?includeRGBA:[0-9a-f]{8}$/i)) {
            var components = process.argv[i].replace (/^--?includeRGBA:/i, '').match (/[0-9a-f]{2}/gi);
            includeRGBA[0] = includeR = +('0x' + components[0]);
            includeRGBA[1] = includeG = +('0x' + components[1]);
            includeRGBA[2] = includeB = +('0x' + components[2]);
            includeRGBA[3] = includeA = +('0x' + components[3]);
        }

        // The gradient array that defines the escape colors (✓)
        else if (process.argv[i].match (/^--?escapeGradient:\[[0-9a-f]{8}(,[0-9a-f]{8})*\]$/i)) {
            escapeGradient = process.argv[i].replace (/^--?escapeGradient:/i, '').match (/[0-9a-f]{8}/gi);
            escapeGradientBuffArr.reset ().mergeBuffer (new Buffer ('[' + escapeGradient + ']'));
        }

        // Show verbose ETA for debugging ETA purposes (✓)
        else if (process.argv[i].match (/^--?debugETA/i)) {
            debugETA = true;
            booleans = booleans | 0x20;
        }

        // Hide verbose ETA for debugging ETA purposes (✓)
        else if (process.argv[i].match (/^--?stopDebugETA/i)) {
            debugETA = false;
            booleans = booleans & 0xdf;
        }

        // An unknown argument was fed (✓)
        else
            console.log ('Unknown argument: "'.yellow + process.argv[i].red + '"'.yellow);
    }

    // Save the new settings if indicated
    if (useStoredSettings) {
        saveUserSettings (false, function () {
            process.stdout.write (('Done applying settings!' + cRet).green);
            if (isWindows) process.stdout.write ('\0338');

            setTimeout (calculateMandelbrotSet, 1000);
        });
    }

    // Only save that the user does not want the settings saved
    else {
        saveUserSettings (true, function () {
            process.stdout.write (('Done applying temporary settings!' + cRet).green);
            if (isWindows) process.stdout.write ('\0338');

            setTimeout (calculateMandelbrotSet, 1000);
        });
    }
}

// Saves the current variable values to the settings file
function saveUserSettings (reduced, callback) {
    var saveBuffer = new BufferArray ();
    saveBuffer.mergeBuffer (SAVE_FILE_SIGNATURE).push (booleans);

    console.log ('is a reduced save file: ' + reduced);
    console.log ('escapeGradient:'.red);
    console.log (escapeGradient);

    var sBuff = reduced? saveBuffer.buffer () : saveBuffer.mergeBuffer (widthBuff)
                                                          .mergeBuffer (heightBuff)
                                                          .mergeBuffer (xminBuff)
                                                          .mergeBuffer (ycenterBuff)
                                                          .mergeBuffer (maxMagnitudeBuff)
                                                          .mergeBuffer (iterationsBuff)
                                                          .mergeBuffer (includeRGBA)
                                                          .mergeBuffer (new Buffer ('[' + escapeGradient + ']'))
                                                          .mergeBuffer (new Buffer ('mandelbrot'))
                                                          .buffer ();
    console.log ('expected save length: ' + (SAVE_FILE_SIGNATURE.length + 1 + widthBuff.length + heightBuff.length +
        xminBuff.length + ycenterBuff.length + maxMagnitudeBuff.length + iterationsBuff.length + includeRGBA.length +
        (new Buffer ('[' + escapeGradient + ']')).length + (new Buffer ('mandelbrot')).length));
    console.log ('actual length: ' + sBuff.length);
    console.log ('save buffer: '.red);
    console.log (sBuff);
    console.log ('');

    // Write the buffer to the file descriptor
    fs.writeFile (SETTINGS_FILE, sBuff, function (e) {
        if (e) {
            console.log (('There was an error writing/saving the ' + (reduced? 'reduced ' : '') + 'settings file').red);
            console.log (('' + e).red);
        }

        else if (callback) callback ();
    });
}

// The main attraction
var I_FRQ = 1,
    S_IDX = 0,
    loadingIconArray = isWindows? [['0', 'O', 'o', '.', 'o', 'O'], I_FRQ, S_IDX] : [['⠋', '⠙', '⠚', '⠓'], I_FRQ, S_IDX];
    mandyPercent = ['    ', loadingIconArray, '     '],
    initMessageLen = mandyPercent.length,
    calculatingMandyLA = new ConsoleLineAnimation (mandyPercent, ANIMATION_INT),

    // Used to estimate the time remaining
    SMOOTHING_FACTOR = 0.007,
    previousPercent  = 0,
    previousSpeed    = 0,
    averageSpeed     = 0,
    previousTime     = 0,
    etaMS            = 0,
    time0 = 0;

    // Add placeholders for the mandyPercent array
    mandyPercent.push ('');
    mandyPercent.push (' - ');
    mandyPercent.push ('');

function calculateMandelbrotSet () {
    // Clear the last log
    readline.clearLine (process.stdout, 0);

    // Calculate additional variables needed for the mandelbrot image and the program
    time0 = Date.now ();

    // Fixes reverse y-center value in the image
    ycenter *= -1;

    // Correct possible mixup by user
    xmin = Math.min (xmin, xmax);
    xmax = Math.max (xmin, xmax);

    var xWidth = Math.abs (xmax - xmin),
        yHalfHeight = xWidth * height / width / 2;

    // Calculated from the image resolution to avoid skewing the final image
    var ymin = ycenter - yHalfHeight,
        ymax = ycenter + yHalfHeight;

    var htmlFile = fileName + '.html',
        pngFile = fileName + '.png';

    // Log the variables used by the program to inform the user
    console.log ('\nConstructing the mandelbrot image!\n'.green);
    if (includeHTML) console.log ('    HTML file is included!'.cyan);

    console.log (('    dimensions: ' + width + 'x' + height).magenta);
    console.log (('    iterations: ' + iterations + ' per pixel\n').magenta);
    console.log (('    escape mag: ' + maxMagnitude).magenta);
    console.log (('          xmin: ' + xmin).magenta);
    console.log (('          xmax: ' + xmax).magenta);
    console.log (('          ymin: ' + ymin).magenta);
    console.log (('          ymax: ' + ymax + '\n\n').magenta);


    // Fork the process that will calculate
    previousTime = Date.now ();
    mandelbrotCalculatingChildProcess = cp.fork (__dirname + '/calculations.js');
    mandelbrotCalculatingChildProcess.on ('message', function (outputs) {
        var percent = outputs[0],
            mu = outputs[1];

        if (percent < 100) {
            var percentNum = Math.round (1000 * percent) / 1000,
                speed = 60 * (percentNum - previousPercent) / (Date.now () - previousTime);

            percent += '';
            if (!percent.match (/\./)) percent += '.';
            while (percent.length < 6) percent += '0';
            percent += '%';

            // Calculate ETA using exponential decay algorithm
            averageSpeed = SMOOTHING_FACTOR * speed + (1 - SMOOTHING_FACTOR) * averageSpeed;
            etaMS = (100 - percentNum) / averageSpeed;

            calculatingMandyLA.anim[initMessageLen] = percent;
            calculatingMandyLA.anim[initMessageLen + 2] = toReadableTime (etaMS, true) + ' ETA';

            // Store the values for the next calculation
            previousPercent = percentNum;
            previousSpeed = speed;
        }

        else {
            mandelbrotCalculatingChildProcess.kill ();
            calculatingMandyLA.stop ();

            // Log the final execution time and that progress is complete
            console.log (('    100.000% - ' + toReadableTime (Date.now () - time0) + '\n').green);
            console.log (('The file' + (includeHTML? 's' : '') + ' "' +
                pngFile + '"' + (includeHTML? ' and "' + htmlFile + '"' +
                ' were' : ' was') + ' successfully saved in the current directory').green);
        }
    });

    mandelbrotCalculatingChildProcess.send ({
        width: width,
        height: height,
        xmin: xmin,
        xmax: xmax,
        ymin: ymin,
        ymax: ymax,
        maxMagnitude: maxMagnitude,
        iterations: iterations,
        includeR: includeR,
        includeG: includeG,
        includeB: includeB,
        includeA: includeA,
        escapeGradient: escapeGradient,
        includeHTML: includeHTML,
        htmlFile: htmlFile,
        pngFile: pngFile
    });

    calculatingMandyLA.log ('yellow');
}



// Used to convert milliseconds to a human-readable string (✓✓)
function toReadableTime (ms, noShowDecimal) {
    if (isNaN(ms)) return '';

    var exeSeconds = ms / 1000,
        exeMinutes = exeSeconds / 60,
        exeHours   = exeMinutes / 60,
        exeDays    = exeHours / 24,

        s = (noShowDecimal? Math.round (exeSeconds) : Math.round (1000 * exeSeconds) / 1000) % 60,
        m = (exeMinutes % 60) >> 0,
        h = (exeHours % 24) >> 0,
        d = exeDays >> 0;

    // Keep the string length consistent-ish
    s += noShowDecimal? '' : '0000';

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

    var exeMS = Math.round (1000 * exeSeconds);
    return (d? d + 'd ' : '') + (h? h + 'h ' : '') + (m? m + 'm ' : '') + s + 's' +
        (noShowDecimal? '' : ' (' + exeMS + 'ms)' +
        (debugETA? '\n(' + maxETA + ' max ETA ms)' + '\n(' + (maxETA / exeMS) + ' max ETA / exe Time)': ''));
}

// Buffer for speed with appendability of Array
function BufferArray () {
    var n = 64,
        buffer = new Buffer (n);

    // Represents the number of significant bytes in the internal buffer
    this.length = 0;

    // Resets the internal buffer and sets the length to 0
    this.reset = function () {
        n = 64;
        buffer = new Buffer (n);
        this.length = 0;

        return this;
    };

    // Sets the i_th byte in buffer
    this.set = function (i, byte) {
        // Increase the internal buffer size if i + 1 > n
        if (i + 1 > n) {
            while (i + 1 > n) n *= 2;
            var newInternalBuffer = new Buffer (n);

            // Clear any memory that might not be zeroed out
            for (var j = this.length; j < i; j++) 
                newInternalBuffer[j] = 0x0;

            // Copy the old buffer into the new buffer, then trash the old buffer
            for (var j = 0; j < this.length; j++)
                newInternalBuffer[j] = buffer[j];

            this.length = i + 1;
            buffer = newInternalBuffer;
            newInternalBuffer = null;
        }

        buffer[i] = byte;
        return this;
    };

    // Gets the i_th byte from buffer
    this.get = function (i) {return i < this.length? buffer[i] : NaN;};

    // Adds a new byte to the internal buffer
    this.push = function (byte) {
        var l = this.length++;

        // Double internal storage size if the new byte will not fit
        if (this.length > n) {
            n *= 2;
            var newInternalBuffer = new Buffer (n);

            // Copy the old buffer into the new buffer, then trash the old buffer
            for (var i = 0; i < l; i++)
                newInternalBuffer[i] = buffer[i];

            buffer = newInternalBuffer;
        }

        buffer[l] = byte;

        return this;
    };

    // Merges the bytes of the new buffer with the internal buffer
    this.mergeBuffer = function (newBuffer) {
        var oldLength = this.length;
        this.length += newBuffer.length;

        // Increase the buffer size if it is too small for the new data
        if (this.length > n) {
            // Double the internal size to decrease need to double logarithmically
            while (this.length > n) n *= 2;
            var newInternalBuffer = new Buffer (n);

            // Copy the old buffer into the new buffer
            for (var i = 0; i < oldLength; i++)
                newInternalBuffer[i] = buffer[i];

            buffer = newInternalBuffer;
        }

        // Copy the new buffer data to the internal buffer
        for (var i = oldLength; i < this.length; i++)
            buffer[i] = newBuffer[i - oldLength];

        return this;
    };

    // Returns the internal buffer without the extra padding
    this.buffer = function () {
        var internalBuffer = new Buffer (this.length);

        for (var i = 0; i < this.length; i++)
            internalBuffer[i] = buffer[i];

        return internalBuffer;
    };
}

// Generic console logging animator to let the user know that the program is still running (✓✓)
function ConsoleLineAnimation (animationArray, coreMSInterval) {
    var ms   = coreMSInterval,

        // Windows ANSI stuff
        SAVE_CURSOR_POSITION    = '\033[s',
        RESTORE_CURSOR_POSITION ='\0338',

        // My custom array format stuff
        ANIMATION_ARRAY = 0,
        ANIMATION_FREQ  = 1,
        ANIMATION_INDEX = 2,

        t = -1,
        jsInterval = false,
        color = false,
        context = this;

    // Public access for ez manipulation
    this.anim = animationArray;

    this.log = function (logColor) {
        if (logColor) color = logColor;
        if (isWindows) process.stdout.write (SAVE_CURSOR_POSITION);

        jsInterval = setInterval (update, ms);
        return this;
    };

    this.stop = function () {
        if (jsInterval) {
            readline.clearLine (process.stdout, 0);
            if (isWindows) process.stdout.write (RESTORE_CURSOR_POSITION);
            else process.stdout.write (cRet);

            clearInterval (jsInterval);
            color = false;
            jsInterval = false;
        }

        return this;
    };

    // Internal updating function
    function update () {
        // Advance to the next step
        t++;

        // Holds the string that will be logged to the console
        var s = '';
        for (var i = 0; i < context.anim.length; i++) {
            var e = context.anim[i],
                a = e[ANIMATION_ARRAY],
                f = e[ANIMATION_FREQ];

            // Calculate the next value in the animation array to concatenate
            if (e instanceof Array) 
                s += a[(!t || !(t % f)? e[ANIMATION_INDEX]++ : e[ANIMATION_INDEX]) % a.length];

            // Concatenate the simple string otherwise
            else s += e;
        }

        // Clear the line, log the string, then reset the cursor for easy clearance
        readline.clearLine (process.stdout, 0);
        process.stdout.write (color? (s + cRet)[color] : s + cRet);
        if (isWindows) process.stdout.write (RESTORE_CURSOR_POSITION);
    }
}



/* SAVE FILE FORMAT:
    BYTE  0       (1): [use save file, include HTML, debug ETA, 0, 0, 0, 0, 0]
    BYTES 1 - 4   (4): Uint32Array image width
    BYTES 5 - 8   (4): Uint32Array image height
    BYTES 9 - 16  (8): Float64Array x-min value
    BYTES 17 - 24 (8): Float64Array x-max value
    BYTES 25 - 32 (8): Float64Array y-center value
    BYTES 33 - 40 (8): Float64Array max magnitude
    BYTES 41 - 44 (4): Uint32Array  iterations per pixel
    BYTES 45 - 48 (4): Include RGBA value
    BYTE  49      (1): '[' (0x5b)
    BYTE  50      (1): ']'

    if BYTE 50 is not ']', BYTES 50 - 54 (4): First gradient RGBA value
        
        BYTE 55 (1): ',' (0x2c) OR BYTE 55 (1): ']' (0x5b)

        if BYTE 55 is ']', continue to the next information stored in file

        otherwise check for ',' + 4 bytes and then ']'. repeat if no ']'
        
    BYTES LEFTOVER ARE THE FILE NAME
*/

// Containers used for byte read and storage
var _64_BITS = 8,
    _32_BITS = 4,

    booleans = 0x80,

    widthBuff = new ArrayBuffer (_32_BITS),
    widthView = new Uint32Array (widthBuff),

    heightBuff = new ArrayBuffer (_32_BITS),
    heightView = new Uint32Array (heightBuff),

    xminBuff = new ArrayBuffer (_64_BITS),
    xminView = new Float64Array (xminBuff),

    xmaxBuff = new ArrayBuffer (_64_BITS),
    xmaxView = new Float64Array (xmaxBuff),

    ycenterBuff = new ArrayBuffer (_64_BITS),
    ycenterView = new Float64Array (ycenterBuff),

    maxMagnitudeBuff = new ArrayBuffer (_64_BITS),
    maxMagnitudeView = new Float64Array (maxMagnitudeBuff),

    iterationsBuff = new ArrayBuffer (_32_BITS),
    iterationsView = new Uint32Array (iterationsBuff),

    includeRGBA = new Buffer (_32_BITS),

    escapeGradientBuffArr = new BufferArray (),
    fileNameBuffArr = new BufferArray ();

// Add a length property to the array buffers
widthBuff.length = _32_BITS;
heightBuff.length = _32_BITS;
xminBuff.length = _64_BITS;
xmaxBuff.length = _64_BITS;
ycenterBuff.length = _64_BITS;
maxMagnitudeBuff.length = _64_BITS;
iterationsBuff.length = _32_BITS;

// Default values for a standard image
var SAVE_FILE_SIGNATURE = new Buffer ([0x1, 0xe, 0xa, 0xf, 0xb, 0x1, 0xa, 0xd, 0xe]),
    DEFAULT_BOOLEANS = 0x80 & 0xff;
    DEFAULT_WIDTH  = 1440,
    DEFAULT_HEIGHT = 1320,

    DEFAULT_XMIN         = -2.0,
    DEFAULT_XMAX         = 0.55,
    DEFAULT_YCENTER      = 0.0,
    DEFAULT_MAXMAGNITUDE = 2.0,
    DEFAULT_ITERATIONS   = 150,

    DEFAULT_INCLUDE_R = 0x0,
    DEFAULT_INCLUDE_G = 0x0,
    DEFAULT_INCLUDE_B = 0x0,
    DEFAULT_INCLUDE_A = 0xff,

    DEFAULT_ESCAPEGRADIENT = new Buffer ('[]');

// Variables that hold the values used by the mandelbrot calculations
var width,
    height,

    xmin,
    xmax,
    ycenter,
    maxMagnitude,
    iterations,

    includeR,
    includeG,
    includeB,
    includeA,

    escapeGradient;

// Boolean flags for the program
var useStoredSettings = true,
    includeHTML = false,
    debugETA = false,
    fileName = false;
