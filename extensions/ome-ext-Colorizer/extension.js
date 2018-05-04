const Colorizer = require('./Colorizer');

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
        [{title: "Attempts to use the Operating System's window border colors, if supported."},
          ['checkbox', '', 'use_system_colors'],
          ['label', 'Use System Colors', 'use_system_colors']
        ],
        [{title: "Primary is the color used for backgrounds"},
          ['color', '', 'primary'],
          ['hex', '', 'primary'],
          ['label', 'Primary', 'primary']
        ],
        [{title: "Secondary is the color used for buttons, text fields, and other input elements that are laid atop primary colors."},
          ['color', '', 'secondary'],
          ['hex', '', 'secondary'],
          ['label', 'Secondary', 'secondary']
        ]
      ]
    );
    ex.on('enable', () => {
      Colorizer.setup(ex.getConf());
    });
    ex.on('disable', () => {
      Colorizer.removeColorTable();
    });
    ex.on('conf-set', (k, v) => {
      Colorizer.setup(ex.getConf());
    });
  }
}
