const Colorizer = require('./Colorizer');

module.exports = {
  name: 'Colorizer',
  setup: (ex) => {
    ex.conf(
      {
        'use_system_colors': true,
        'foreground': '#0277bd',
        'background': '#212121'
      }/*,
      [
        [
          ['checkbox', 'use_system_colors'],
          ['label', 'Use System Colors']
        ],
        [
          ['color', 'foreground'],
          ['label', 'Secondary'];
        ],
        [
          ['color', 'background'],
          ['label', 'Primary'];
        ]
      ]*/
    );
    ex.on('enable', () => {
      Colorizer.setup(ex.getConf());
    });
    ex.on('disable', () => {
      Colorizer.removeColorTable();
    });
    ex.on('conf-set', (k, v) => {
    });
  }
}
