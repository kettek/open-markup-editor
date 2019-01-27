module.exports = {
  name: 'Creole 1.0',
  supports: ['creole', 'txt'],
  setup: pack => {
    let Creole = null;
    let creole = null;
    let options = {};

    pack.render = (text) => {
      return creole.parse(text);
    };

    pack.cheatsheet = () => {
      let cheatsheet = '';
      return {
        text: cheatsheet,
        html: pack.render(cheatsheet)
      }
    };

    pack.on('enable', () => {
      Creole = require('npm-creole');
      creole = new Creole();
    });

    pack.on('disable', () => {
      delete require.cache[require.resolve('npm-creole')];
      Creole = null;
      creole = null;
    });

  }
};
