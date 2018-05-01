// Somewhat goofy automatic color palette generator (can use Windows border colors, tested only on W10).
const WinColor = require('windows-titlebar-color');

let Colorizer = {
  setup: (use_system_colors, color) => {
    if (use_system_colors) {
      if (WinColor.isDetectable) {
        color = WinColor.titlebarColor;
      }
    }
    let table = Colorizer.buildColorTable(color);
    Colorizer.insertColorTable(table);
  },
  insertColorTable: table => {
    // Remove old color table css if it exists
    Colorizer.removeColorTable();

    let css = ':root {\n';
    css += table.map( e => {
      let item = Object.entries(e)[0];
      return '--' + item[0] +': '+item[1]+';';
    }).join('\n');
    css += '\n}';

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
    color = Colorizer.hexToRgb(color);
    light = Object.assign({}, color);
    dark  = Object.assign({}, color);

    // Not really material colors, but let's try it... dark = -46, light = +49
    light.r += 49, light.g += 49, light.b += 49;
    dark.r  -= 46, dark.g  -= 46, dark.b  -= 46;

    return [
      {"s":        Colorizer.rgbToHex(color)},
      {"s-light":  Colorizer.rgbToHex(light)},
      {"s-dark":   Colorizer.rgbToHex(dark)}
    ]
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
  }
};

module.exports = Colorizer;
