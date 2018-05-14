const Colorizer = require('./Colorizer');

const getColorHexRGB = require('electron-color-picker').getColorHexRGB;

const getColor = async () => {
  const color = await getColorHexRGB()
  return color;
}

module.exports = {
  name: 'Colorizer',
  setup: (ex) => {
    ex.conf(
      {
        'use_system_colors': true,
        'secondary': '#0277bd',
        'primary': '#212121'
      },
      [
        ['section', {title: "Attempts to use the Operating System's window border colors, if supported."},
          ['checkbox', '', 'use_system_colors'],
          ['label', 'Use System Colors', 'use_system_colors']
        ],
        ['section', {title: "Primary is the color used for backgrounds", disabled: () => { return ex.get('use_system_colors') }},
          ['button', '✎', {
            onclick: () => {
              getColor().then(color=>ex.set('primary', color))
            },
            style: "display: inline-block;"
          }],
          ['color', '', 'primary'],
          ['hex', '', 'primary'],
          ['label', 'Primary', 'primary']
        ],
        ['section', {title: "Secondary is the color used for buttons, text fields, and other input elements that are laid atop primary colors.", disabled: () => { return ex.get('use_system_colors') } },
          ['button', '✎', {
            onclick: () => {
              getColor().then(color=>ex.set('secondary', color))
            },
            style: "display: inline-block;"
          }],
          ['color', '', 'secondary'],
          ['hex', '', 'secondary'],
          ['label', 'Secondary', 'secondary']
        ]
      ]
    );
    ex.on('enable', () => {
      Colorizer.setup(ex.get());
    });
    ex.on('disable', () => {
      Colorizer.removeColorTable();
    });
    ex.on('conf-set', (k, v) => {
      Colorizer.setup(ex.get());
    });
  }
}
