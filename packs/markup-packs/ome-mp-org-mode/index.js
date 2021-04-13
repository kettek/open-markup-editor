module.exports = {
  name: 'OrgMode',
  supports: {
    'OrgMode': ['org'],
  },
  setup: pack => {
    let orga, mutate, html = null;
    let processor = null;

    pack.render = (text) => {
      return new Promise((resolve, reject) => {
        processor.process(text)
        .then(file => {
          resolve(file.contents);
        }, err => {
          reject(err);
        });
      });
    };

    pack.on('enable', () => {
      orga = require('orga-unified');
      mutate = require('reorg-rehype');
      html = require('rehype-stringify');
      processor = orga().use(mutate).use(html);
    });

    pack.on('disable', () => {
      delete require.cache[require.resolve('orga-unified')];
      delete require.cache[require.resolve('reorg-rehype')];
      delete require.cache[require.resolve('rehype-stringify')];
      processor = null;
    });
  }
};
