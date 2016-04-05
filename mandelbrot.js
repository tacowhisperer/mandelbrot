/********************************************************************************************************************************
 *                                 PROGRAM MODULES, VARIABLES, AND INITIALIZATION OF ENVIRONMENT                                *
 ********************************************************************************************************************************/
// Load the required Node.js modules
var fs       = require ('fs'),
    readline = require ('readline'),
    colors   = require ('colors'),
    cp       = require ('child_process'),
    zlib     = require ('zlib');

// Holds the mandelbrot calculating child process
var mandelbrotCalculatingChildProcess = null;

// Name of the settings file
var SETTINGS_FILE = 'mandelbrot.settings';

// Differentiate carriage return based on OS
var cRet = '\r',
    isWindows = false;

// Windows ANSI stuff
var SAVE_CURSOR_POSITION    = '\033[s',
    RESTORE_CURSOR_POSITION = '\0338';

// Windows is typically win32 or win64
if (process.platform.match (/^win/i)) {
    cRet = '';
    isWindows = true;
}

// Animation constants
var ANIMATION_MS = 100,
    READ_MS = 1000;

/********************************************************************************************************************************
 *                                             MANDELBROT VALUES AND NAMING STRINGS                                             *
 ********************************************************************************************************************************/
// Default values for a standard image
var SAVE_FILE_SIGNATURE = new Buffer ([0x1, 0xe, 0xa, 0xf, 0xb, 0x1, 0xa, 0xd, 0xe]),
    
    DEFAULT_FILENAME = 'mandelbrot',

    DEFAULT_USE_SETTINGS = true,
    DEFAULT_INCLUDE_HTML = false,
    DEFAULT_DEBUG_ETA    = false,

    DEFAULT_WIDTH  = 1440,
    DEFAULT_HEIGHT = 1320,

    DEFAULT_XMIN    = -2.0,
    DEFAULT_XMAX    = 0.55,
    DEFAULT_YCENTER = 0.0,

    DEFAULT_MAXMAGNITUDE = 2.0,
    DEFAULT_ITERATIONS   = 150,

    DEFAULT_INCLUDE_R = 0x0,
    DEFAULT_INCLUDE_G = 0x0,
    DEFAULT_INCLUDE_B = 0x0,
    DEFAULT_INCLUDE_A = 0xff,

    DEFAULT_ESCAPEGRADIENT = [];

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

// Main save file object
var programSettings = new SaveFile (SETTINGS_FILE, SAVE_FILE_SIGNATURE);


/********************************************************************************************************************************
 *                                         MAIN PROGRAM FUNCTIONS AND HELPER FUNCTIONS                                          *
 ********************************************************************************************************************************/
// Used to store input from stdin
var stdinAnswer = '',
    open = false,
    stdinCallback = function () {console.log ('No stdin callback specified'.red);};
process.stdin.on ('data', function (data) {
    var chars = data.toString ('utf8');

    if (open) {
        // Stop receiving text on return
        if (chars == '\n' || chars == '\r' || chars == '\r\n') {
            open = false;
            process.stdin.pause ();
            stdinCallback ();
        }

        else if (chars.match (/\n|\r/)) {
            var carriageReturns = chars.match (/[^\n\r]+/);
            stdinAnswer += carriageReturns? carriageReturns[0] : '';
            open = false;
            process.stdin.pause ();
            stdinCallback ();
        }

        // Append all characters otherwise
        else stdinAnswer += chars;
    }
});


// Lets the user know that settings are being read from storage
var checkAnim = ['Checking for settings', [['', '.', '..', '...'], 1, 0]],
    checkLA   = new ConsoleLineAnimation (checkAnim, ANIMATION_MS);

// Gets the ball rolling
executeTheMainProgram ();
function executeTheMainProgram () {
    checkLA.log ('yellow');
    programSettings.readVariables (updateSavedSettingsWithArgs, {
        'ENOENT': function (weAlreadyKnowThis) {
            checkLA.stop ();
            if (!weAlreadyKnowThis) console.log ('No previous settings were found.'.yellow);

            // Open stdin for user input to answer the question
            open = true;
            stdinCallback = createNewSettings;
            process.stdout.write ('Would you like to save your settings? (y/n then Enter at least twice): ');
            process.stdin.resume ();
        }
    });
}

// Answer the question of whether or not the user would like to save their settings
function createNewSettings () {
    // Clear failed settings find and the the prompt log on the terminal
    if (isWindows) process.stdout.write (RESTORE_CURSOR_POSITION);
    else process.stdout.write (cRet);
    readline.clearLine (process.stdout, 0);
    readline.moveCursor (process.stdout, 0, -1);
    readline.clearLine (process.stdout, 0);
    if (isWindows) process.stdout.write (SAVE_CURSOR_POSITION);

    if (stdinAnswer.match (/^y/i)) {
        useStoredSettings = true;
        programSettings.saveVariables (toSaveObject (), function () {
            console.log ('Settings file was successfully created'.green);

            setTimeout (function () {
                // Clear the previous log before executing the main function again
                if (isWindows) process.stdout.write (RESTORE_CURSOR_POSITION);
                else process.stdout.write (cRet);
                readline.clearLine (process.stdout, 0);

                executeTheMainProgram ();
            }, READ_MS);
        });
    }

    else if (stdinAnswer.match (/^n/i)) {
        useStoredSettings = false;
        programSettings.saveVariables (toSaveObject (), function () {
            console.log ('Setting to not save settings saved... lol'.green);

            setTimeout (function () {
                // Clear the previous log before executing the main function again
                if (isWindows) process.stdout.write (RESTORE_CURSOR_POSITION);
                else process.stdout.write (cRet);
                readline.clearLine (process.stdout, 0);

                executeTheMainProgram ();
            }, READ_MS);
        });
    }

    else {
        console.log (('Your answer, "' + stdinAnswer + '", is not y/n.').red);
        setTimeout (function () {
            // Clear the previous log before prompting atain
            if (isWindows) process.stdout.write (RESTORE_CURSOR_POSITION);
            else process.stdout.write (cRet);
            readline.clearLine (process.stdout, 0);

            executionErrorCallback['ENOENT'] (true);
        }, READ_MS);
    }
}

// Update the current session with arguments provided, and save them
function updateSavedSettingsWithArgs (settings) {
    // Done checking for settings
    checkLA.stop ();

    // Arguments fed by the user start at index 2 in Node.js
    for (var i = 2; i < process.argv.length; i++) {

        // Whether to save settings or not
        if (process.argv[i].match (/^--?saveSettings:(y(e|es)?|no?|1|0|t(rue)?|f(alse)?)$/i)) {
            var ans = process.argv[i].replace (/^--?saveSettings:/i, '').toLowerCase ();

            switch (ans) {
                case 'y':
                case 'ye':
                case 'yes':
                case '1':
                case 't':
                case 'true':
                    settings.useStoredSettings = true;
                    break;

                default:
                    settings.useStoredSettings = false;
                    break;
            }
        }

        // Include the HTML file (✓)
        else if (process.argv[i].match (/^--?HTML$/i))
            settings.includeHTML = true;

        // Do not include the HTML file (✓)
        else if (process.argv[i].match (/^--?noHTML$/i))
            settings.includeHTML = false;

        // What the output file(s) name should be (✓)
        else if (process.argv[i].match (/^--?filename:/i))
            settings.fileName = process.argv[i].replace (/\/|\?|<|>|\\|:|\*|\||"|^--?filename:/gi, '');

        // The dimensions of the image (✓)
        else if (process.argv[i].match (/^--?size:\d+\D\d+$/i)) {
            var dimensions = process.argv[i].match (/\d+/g);
            settings.width = dimensions[0];
            settings.height = dimensions[1];
        }

        // The minimum x-value (✓)
        else if (process.argv[i].match (/^--?xmin:\-?\d+\.?\d*$/i))
            settings.xmin = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

        // The maximum x-value (✓)
        else if (process.argv[i].match (/^--?xmax:\-?\d+\.?\d*$/i))
            settings.xmax = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

        // The center y-value (✓)
        else if (process.argv[i].match (/^--?ycenter:\-?\d+\.?\d*$/i))
            settings.ycenter = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

        // The escape magnitude (✓)
        else if (process.argv[i].match (/^--?maxMagnitude:\-?\d+\.?\d*$/i))
            settings.maxMagnitude = +process.argv[i].match (/\-?\d+\.?\d*/)[0];

        // The number of iterations per pixel (✓)
        else if (process.argv[i].match (/^--?iterations:\d+$/i))
            settings.iterations = +process.argv[i].match (/\d+/)[0];

        // The RGBA color of pixels that are included in the Mandelbrot Set (✓)
        else if (process.argv[i].match (/^--?includeRGBA:[0-9a-f]{8}$/i)) {
            var components = process.argv[i].replace (/^--?includeRGBA:/i, '').match (/[0-9a-f]{2}/gi);
            settings.includeR = +('0x' + components[0]);
            settings.includeG = +('0x' + components[1]);
            settings.includeB = +('0x' + components[2]);
            settings.includeA = +('0x' + components[3]);
        }

        // The gradient array that defines the escape colors (✓)
        else if (process.argv[i].match (/^--?escapeGradient:\[[0-9a-f]{8}(,[0-9a-f]{8})*\]$/i)) {
            settings.escapeGradient = process.argv[i].replace (/^--?escapeGradient:/i, '').match (/[0-9a-f]{8}/gi);
            settings.escapeGradient = settings.escapeGradient? settings.escapeGradient : [];
        }

        // Show verbose ETA for debugging ETA purposes (✓)
        else if (process.argv[i].match (/^--?debugETA/i))
            settings.debugETA = true;

        // Hide verbose ETA for debugging ETA purposes (✓)
        else if (process.argv[i].match (/^--?stopDebugETA/i))
            settings.debugETA = false;

        // An unknown argument was fed (✓)
        else
            console.log ('Unknown argument: "'.red + process.argv[i].yellow + '"'.red);
    }

    // Set all necessary global variables for calculations and save all new settings generated to the file
    setGlobalVariablesFromSettingsObject (settings);
    programSettings.saveVariables (toSaveObject (), calculateMandelbrotSet)
}

// The main attraction
var I_FRQ = 1,
    S_IDX = 0,
    loadingIconArray = isWindows? [['0', 'O', 'o', '.', 'o', 'O'], I_FRQ, S_IDX] : [['⠋', '⠙', '⠚', '⠓'], I_FRQ, S_IDX],
    mandyPercent = ['    ', loadingIconArray, '     '],
    initMessageLen = mandyPercent.length,
    calculatingMandyLA = new ConsoleLineAnimation (mandyPercent, ANIMATION_MS),

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
    if (isWindows) process.stdout.write (RESTORE_CURSOR_POSITION);
    else process.stdout.write (cRet);
    readline.clearLine (process.stdout, 0);

    // Save the starting time of the calculation
    time0 = Date.now ();

    // Fixes reverse y-center value in the image
    ycenter *= -1;

    // Correct possible mixup by the user
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

    // Fork the process that will calculate
    previousTime = Date.now ();
    mandelbrotCalculatingChildProcess = cp.fork (__dirname + '/calculations.js');
    mandelbrotCalculatingChildProcess.on ('message', function (outputs) {
        var percent = outputs[0],
            mu = outputs[1];

        if (typeof percent == 'number' && percent < 100) {
            var percentNum = Math.round (1000 * percent) / 1000,
                speed = 60 * (percentNum - previousPercent) / (Date.now () - previousTime);

            percent += '';
            if (!percent.match (/\./)) percent += '.';
            while (percent.length < 6) percent += '0';

            // Truncate the extra percentage values
            var decimals = percent.match (/\.\d\d\d\d/);
            if (decimals) 
                percent = percent.replace (/\.\d+$/, decimals[0].substr (0, 4));

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

        else if (mu === 'packing') {
            // Change the animation to the packing sequence
            var dA = [['', '.', '..', '...'], I_FRQ, S_IDX];
            calculatingMandyLA.anim = ['    ', isWindows? '*' : '⌛', '   Packing raw PNG data. Please wait', dA];
        }


        else if (mu === 'finish') {
            mandelbrotCalculatingChildProcess.kill ();
            calculatingMandyLA.stop ();

            // Log the final execution time and that progress is complete
            console.log (('    100.000% - ' + toReadableTime (Date.now () - time0) + '\n').green);
            console.log (('The file "' + pngFile + '" was successfully saved in the current directory').green);

            process.exit (0);
        }

        else if (mu === 'finish:true') {
            mandelbrotCalculatingChildProcess.kill ();
            calculatingMandyLA.stop ();

            // Log the final execution time and that progress is complete, except the HTML file
            console.log (('    100.000% - ' + toReadableTime (Date.now () - time0) + '\n').yellow);
            console.log (('The file "' + pngFile + '" was successfully saved in the current directory, ' +
                'but the file "' + htmlFile + '" experienced an error and had to be aborted.'));
        }

        else if (mu === 'finish:false') {
            mandelbrotCalculatingChildProcess.kill ();
            calculatingMandyLA.stop ();

            // Log the final execution time and that progress is complete, including HTML file
            console.log (('    100.000% - ' + toReadableTime (Date.now () - time0) + '\n').green);
            console.log (('The files "' + pngFile + '" and "' + htmlFile + '" were successfully saved ' +
                'in the current directory').green);
        }

        else if (mu === 'error') {
            mandelbrotCalculatingChildProcess.kill ();
            calculatingMandyLA.stop ();

            console.log (('    ' + (isWindows? 'x_x' : '✖_✖')).red);
            console.log ('\nThere was an error writing the PNG file.'.red);
            console.error (percent);

            if (includeHTML) {
                console.log (('\nHowever, the HTML file "' + htmlFile +
                    '" was successfully saved in the current directory').green);
            }

            process.exit (1);
        }

        else if (mu === 'startLog')
            calculatingMandyLA.log ('yellow');

        else {
            mandelbrotCalculatingChildProcess.kill ();
            calculatingMandyLA.stop ();
            
            console.log ('FATAL ERROR: CTHULHU ESCAPED FROM THE VORTEX OF THE UNDERWORLD'.red);
            console.log ('    However, it graciously left tokens for your eye\'s pleasure:'.yellow);
            console.log ('        percent: ' + percent);
            console.log ('             mu: ' + mu);

            process.exit (1);
        }
    });

    var transference = toSaveObject ();
    transference['ymin'] = ymin;
    transference['ymax'] = ymax;
    transference['htmlFile'] = htmlFile;
    transference['pngFile'] = pngFile;
    transference['isWindows'] = isWindows;
    mandelbrotCalculatingChildProcess.send (transference);
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

// Generates an object from the variables that need to be stored to a file
function toSaveObject () {
    return {
        fileName: fileName || DEFAULT_FILENAME,
        useStoredSettings: useStoredSettings,
        includeHTML: includeHTML,
        debugETA: debugETA,
        width: width || DEFAULT_WIDTH,
        height: height || DEFAULT_HEIGHT,
        xmin: xmin,
        xmax: xmax,
        ycenter: ycenter,
        maxMagnitude: maxMagnitude,
        iterations: iterations,
        includeR: includeR,
        includeG: includeG,
        includeB: includeB,
        includeA: includeA,
        escapeGradient: escapeGradient || DEFAULT_ESCAPEGRADIENT
    };
}

// Loads the variables that need values for the program to work correctly
function setGlobalVariablesFromSettingsObject (obj) {
    // Default to default valuse if the value does not exist in the object for any reason
    if (obj.useStoredSettings) {
        fileName = obj.fileName || DEFAULT_FILENAME;

        useStoredSettings = obj.useStoredSettings || DEFAULT_USE_SETTINGS;
        includeHTML = obj.includeHTML || DEFAULT_INCLUDE_HTML;
        debugETA = obj.debugETA || DEFAULT_DEBUG_ETA;

        width = obj.width || DEFAULT_WIDTH;
        height = obj.height || DEFAULT_HEIGHT;

        xmin = obj.xmin || DEFAULT_XMIN;
        xmax = obj.xmax || DEFAULT_XMAX;
        ycenter = obj.ycenter || DEFAULT_YCENTER;

        maxMagnitude = obj.maxMagnitude || DEFAULT_MAXMAGNITUDE;
        iterations = obj.iterations || DEFAULT_ITERATIONS;

        includeR = obj.includeR || DEFAULT_INCLUDE_R;
        includeG = obj.includeG || DEFAULT_INCLUDE_G;
        includeB = obj.includeB || DEFAULT_INCLUDE_B;
        includeA = obj.includeA || DEFAULT_INCLUDE_A;

        escapeGradient = obj.escapeGradient || DEFAULT_ESCAPEGRADIENT;
    }

    else {
        fileName = DEFAULT_FILENAME;

        useStoredSettings = DEFAULT_USE_SETTINGS;
        includeHTML = DEFAULT_INCLUDE_HTML;
        debugETA = DEFAULT_DEBUG_ETA;

        width = DEFAULT_WIDTH;
        height = DEFAULT_HEIGHT;

        xmin = DEFAULT_XMIN;
        xmax = DEFAULT_XMAX;
        ycenter = DEFAULT_YCENTER;

        maxMagnitude = DEFAULT_MAXMAGNITUDE;
        iterations = DEFAULT_ITERATIONS;

        includeR = DEFAULT_INCLUDE_R;
        includeG = DEFAULT_INCLUDE_G;
        includeB = DEFAULT_INCLUDE_B;
        includeA = DEFAULT_INCLUDE_A;

        escapeGradient = DEFAULT_ESCAPEGRADIENT;
    }
}

/********************************************************************************************************************************
 *                                       JAVASCRIPT OBJECTS FOR SIMPLIFYING COMMON TASKS                                        *
 ********************************************************************************************************************************/
// Saves and reads settings to/from file as a JSON object
function SaveFile (saveFileName, signatureBuffer) {
    var sN = saveFileName,
        sB = signatureBuffer;

    // Stores the settings to file
    this.saveVariables = function (json, callback, errCallbacks) {
        // Create empty error callbacks if none provided
        if (!errCallbacks) errCallbacks = {};

        // Store the save file signature in the JSON object
        json['SAVE_FILE_SIGNATURE'] = [];
        for (var i = 0; i < sB.length; i++)
            json['SAVE_FILE_SIGNATURE'].push (sB[i]);

        // Compresses the JSON for reduced storage
        zlib.deflate (JSON.stringify (json), function (err, compressedBuffer) {
            // Writes the file to the disk, truncating if it already exists
            fs.writeFile (sN, compressedBuffer, function (err) {
                if (err && errCallbacks[err.code])
                    errCallbacks[err.code] ();

                else if (err) {
                    console.log (('There was an unhandled error "' + err.code + '" writing the file "' + sN + '"').red);
                    console.error (err);
                }

                else if (callback)
                    callback ();

                else
                    console.log ('No callback specified'.red);
            });    
        });

        

        return this;
    };

    // Reads the settings from file and returns an object of all stored properties
    this.readVariables = function (callback, errCallbacks) {
        // Create empty error callbacks if none provided
        if (!errCallbacks) errCallbacks = {};

        // Reads the file from the disk, unless some error is encountered
        fs.readFile (sN, function (err, settingsZlib) {
            if (err && errCallbacks[err.code])
                errCallbacks[err.code] ();

            else if (err) {
                console.error (('There was an unhandled error "' + err.code + '" reading the file "' + sN + '"').red);
                console.error (err);
            }

            else {
                zlib.inflate (settingsZlib, function (e, settingsJSON) {
                    var json = settingsJSON? settingsJSON.toString ('utf8') : 'null';

                    if (e) console.error (e);

                    else if (callback)
                        callback (JSON.parse (json));

                    else
                        console.log ('No callback specified'.red);
                });
            }
        });

        return this;
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
