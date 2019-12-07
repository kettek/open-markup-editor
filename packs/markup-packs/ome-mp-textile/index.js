module.exports = {
  name: 'Textile',
  supports: {
    'Textile': ['textile', 'txt'],
  },
  setup: pack => {
    let textile = null;
    let options = {};

    pack.conf({
      breaks: true,
    },
    ['section', {title: "Options for textile-js"},
      ['checkbox', '', 'breaks'],
      ['label', 'Line-break single newlines within blocks', 'breaks'],
    ])

    pack.render = (text) => {
      return textile(text, options);
    };

    pack.cheatsheet = () => {
      let cheatsheet = '';
      return {
        text: cheatsheet,
        html: pack.render(cheatsheet)
      }
    };

    pack.on('enable', () => {
      textile = require('textile-js');
      options['breaks'] = pack.get('breaks');
    });

    pack.on('conf-set', (key, value) => {
      if (key == 'breaks') {
        options[key] = value;
      }
    });
    pack.on('disable', () => {
      delete require.cache[require.resolve('textile-js')];
      options = {};
    });

  }
};
