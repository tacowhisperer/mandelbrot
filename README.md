# mandelbrot.js
Generates a PNG of the good ol' Mandy with Node.js

### Usage

#### Default Settings
For the default image with default settings, do `node mandelbrot.js`.

#### Arguments
**mandelbrot.js** can also take the following arguments (all are case insensitive):
* `--html` or `-html`
  * Also generate an HTML file with the Mandelbrot set encoded in text

* `--filename:`**`FILE_NAME`** or `-filename:`**`FILE_NAME]`**
  * Make the output file name **`FILE_NAME`**.png and **`FILE_NAME`**.html if HTML is included

* `--size:`**`NATURAL_NUM0`**`x`**`NATURAL_NUM1`** or `-size:`**`NATURAL_NUM0`**`x`**`NATURAL_NUM1`**
  * Creates the PNG (and HTML if also generated) [NATURAL_NUM0] pixels wide and [NATURAL_NUM1] pixels tall

* `--xmin:`**`X`**, `--xmax:`**`X`**, `--ycenter:`**`Y`** or `-xmin:`**`X`**, `-xmax:`**`X`**, `-ycenter:`**`Y`**
  * Used to change the viewport of the image. Because the resolution can be arbitrary, the `ymin` and `ymax` values are calculated internally to avoid stretching the image of the mandelbrot set.

* `--maxMagnitude:`**`X`** or `-maxMagnitude:`**`X`**
  * The escape radius of each pixel of the mandelbrot set.

* `--iterations:`**`WHOLE_NUMBER`** or `-iterations:`**`WHOLE_NUMBER`**
  * Iterations of recursive calculation per pixel (more is more accurate but also longer to calculate)

* `--includeRGBA:`**`STUVWXYZ`** or `-includeRGBA:`**`STUVWXYZ`** where **S**, **T**, **U**, **V**, **W**, **X**, **Y**, **Z** ∈ [0-f] in hex
  * Similar to CSS # color notation, only with an alpha value pair tagged at the end. Used as the include color for a given point of the mandelbrot set.

* `--escapeGradient:`**`[STUVWXYZ(, GHIJKLMN, ...)]`**
  * Same color format as `includeRGBA`, but each color defined in the array is a stopping point for a certain escape speed. The more colors defined in this argument, the more rainbow-y the final image will appear

### About and Licensing
THIS IMPLEMENTATION IS AS-IS, AND COMES WITH NO WARRANTY OF ANY KIND. IT IS SIMPLY A PASSTIME THAT HAPPENS TO BE ALRIGHT AT GENERATING THE MANDELBROT SET IN PNG FORMAT.

All code defined in this project is free to use as you see fit. All that I ask for is credit where credit is due, but it is not imperative as long as that code came from the `mandelbrot.js` file and also not the `ColorGradient` object.
