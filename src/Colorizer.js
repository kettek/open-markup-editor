// Somewhat goofy automatic color palette generator (can use Windows border colors, tested only on W10).
const WinColor = require('windows-titlebar-color');

let Colorizer = {
  setup: (conf) => {
    if (conf.use_system_colors) {
      if (WinColor.isDetectable) {
        conf.foreground = WinColor.titlebarColor;
      }
    }
    // Ensure some sane colors are set
    conf.foreground = conf.foreground || '#0277bd';
    conf.background = conf.background || '#212121';

    // Convert our colors to RGB
    let bg = Colorizer.hexToRgb(conf.background);
    let fg = Colorizer.hexToRgb(conf.foreground);

    // Match our foreground to our background
    fg = Colorizer.matchColorToColor(fg, bg);

    // Build our color tables
    let table = Colorizer.buildColorTable(fg);
    let bg_table = Colorizer.buildColorTable(bg);

    // Insert into DOM
    Colorizer.insertColorTables(bg_table, table);
  },
  insertColorTables: (primary, secondary) => {
    // Remove old color table css if it exists
    Colorizer.removeColorTable();

    // Build our CSS string
    let css = ':root {\n';
    css += primary.map( e => {
      return '--p' + e.name +': '+Colorizer.rgbToHex(e.color)+';';
    }).join('\n');
    css += '\n';
    css += secondary.map( e => {
      return '--s' + e.name +': '+Colorizer.rgbToHex(e.color)+';';
    }).join('\n');
    css += '\n}';

    // Append to the head!
    let style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.appendChild(document.createTextNode(css));
    style.setAttribute('id', 'OME-Colorizer');
    document.getElementsByTagName('head')[0].appendChild(style);
  },
  removeColorTable: () => {
    let style = document.getElementsByTagName('head')[0].querySelector('#OME-Colorizer');
    if (style) style.parentNode.removeChild(style);
  },
  buildColorTable: color => {
    // Clone our color to light and dark variants
    let light = Object.assign({}, color);
    let dark  = Object.assign({}, color);

    // Not really material colors, but let's try it... dark = -46, light = +49
    light.r += 49, light.g += 49, light.b += 49;
    dark.r  -= 46, dark.g  -= 46, dark.b  -= 46;

    // Attempt to brighten or darken it to differentiate from base color (Might not be needed)
    light = Colorizer.matchColorToColor(light, color);
    dark = Colorizer.matchColorToColor(dark, color);

    // Get our base foreground color
    let fg = Colorizer.hexToRgb(Colorizer.hasLowBrightness(color) ? '#c0c0c0' : '#0f0f0f')

    // Return/build our table
    return [
      {name: "",          color: color},
      {name: "-light",    color: light},
      {name: "-dark",     color: dark},
      {name: "-fg",       color: Colorizer.matchColorToColor(fg, color)},
      {name: "-light-fg", color: Colorizer.matchColorToColor(fg, light)},
      {name: "-dark-fg",  color: Colorizer.matchColorToColor(fg, dark)}
    ]
  },
  matchColorToColor: (fg, bg) => {
    // Bail early if it seems fine
    if (!Colorizer.hasLowColorDifference(bg, fg)) return fg;

    // Lighten or darken the fg based on the bg
    if (Colorizer.hasLowColorDifference(bg, fg) && Colorizer.hasLowBrightness(bg)) {
      while (Colorizer.hasLowColorDifference(bg, fg) && Colorizer.hasLowBrightness(bg)) {
        fg.r += 1;
        fg.b += 1;
        fg.g += 1;
        if (fg.r > 255 || fg.g > 255 || fg.b > 255) break;
      }
    } else if (Colorizer.hasLowColorDifference(bg, fg) && !Colorizer.hasLowBrightness(bg)) {
      while (Colorizer.hasLowColorDifference(bg, fg) && Colorizer.hasLowBrightness(bg)) {
        fg.r -= 1;
        fg.b -= 1;
        fg.g -= 1;
        if (fg.r < 0 || fg.g < 0 || fg.b < 0) break;
      }
    }
    return fg;
  },
  hexToRgb: hex => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
  },
  rgbToHex: (rgb) => {
    function componentToHex(c) {
      c = c < 0 ? 0 : c > 255 ? 255 : c
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
  },
  getBrightness: (rgb) => {
    // Brightness as per https://www.w3.org/TR/AERT#color-contrast
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  },
  hasLowBrightness: (rgb) => {
    // As per W3C color brightness range
    return Colorizer.getBrightness(rgb) < 125
  },
  getColorDifference: (rgb1, rgb2) => {
    // As per W3C color difference calculation
    return (Math.max(rgb1.r, rgb2.r) - Math.min(rgb1.r, rgb2.r)) + (Math.max(rgb1.g, rgb2.g) - Math.min(rgb1.g, rgb2.g)) + (Math.max(rgb1.b, rgb2.b) - Math.min(rgb1.b, rgb2.b));
  },
  hasLowColorDifference: (rgb1, rgb2) => {
    // As per W3C minimum color difference range
    return Colorizer.getColorDifference(rgb1, rgb2) < 500
  }
};

module.exports = Colorizer;
