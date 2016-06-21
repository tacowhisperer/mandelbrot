# mandelbrot.js
Generates a PNG of the good ol' Mandy with Node.js

## Usage

#### Default Settings
For the default image with default settings, do not save preferences.

#### Arguments
**mandelbrot.js** can also take the following arguments. **NO ARGUMENTS CONTAIN SPACES.** Those spaces are just artifacts of bolding certain variables to emphasize that those bolded parts can be any value that fits. All arguments are case insensitive, and all arguments accept 1 or 2 hyphens in the front:
* `--saveSettings:`**`yes`**`|`**`y`**`|`**`1`**`|`**`true`**`|`**`t`**
  * Save image settings to file to avoid entering arguments each time

* `--saveSettings:`**`no`**`|`**`n`**`|`**`0`**`|`**`false`**`|`**`f`**
  * Do not save image settings

* `--HTML`
  * Generate an HTML file with the Mandelbrot set encoded in text

* `--noHTML`
  * Stop generating an HTML file alongside the PNG file

* `--filename:`**`FILE_NAME`**
  * Make the output file name **`FILE_NAME`**.png and **`FILE_NAME`**.html if HTML is included

* `--size:`**`NATURAL_NUM0`**`x`**`NATURAL_NUM1`**
  * Creates the PNG (and HTML if also generated) **`NATURAL_NUM0`** pixels wide and **`NATURAL_NUM1`** pixels tall

* `--xmin:`**`X`**, `--xmax:`**`X`**, `--ycenter:`**`Y`**
  * Used to change the viewport of the image. Because the resolution can be arbitrary, the `ymin` and `ymax` values are calculated internally to avoid stretching the image of the mandelbrot set.

* `--maxMagnitude:`**`X`**
  * The escape radius of each pixel of the mandelbrot set.

* `--iterations:`**`WHOLE_NUMBER`**
  * Iterations of recursive calculation per pixel (more is more accurate but also longer to calculate)

* `--includeRGBA:`**`STUVWXYZ`** where **`S`**, **`T`**, **`U`**, **`V`**, **`W`**, **`X`**, **`Y`**, **`Z`** ∈ `[0-f]` in hex
  * Similar to CSS # color notation, only with an alpha value pair tagged at the end. Used as the include color for a given point of the mandelbrot set.

* `--escapeGradient:`**`[STUVWXYZ`**`(`**`,GHIJKLMN,...`**`)`**`]`**
  * Same color format as `includeRGBA`, but each color defined in the array is a stopping point for a certain escape speed. The more colors defined in this argument, the more rainbow-y the final image will appear. Note that the parenthesis are not actually included.

## About and Licensing
All code defined in this project is free to use as you see fit. All that I ask for is credit where credit is due, but it is not imperative as long as that code does not come from the `ColorGradient` object (color space functions were borrowed from http://easyrgb.com).

THIS IMPLEMENTATION IS AS-IS, AND COMES WITH NO WARRANTY OF ANY KIND. IT IS SIMPLY A PASTIME THAT HAPPENS TO BE ALRIGHT AT GENERATING THE MANDELBROT SET IN PNG AND HTML FORMAT.
