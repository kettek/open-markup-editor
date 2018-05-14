let md = null;

module.exports = {
  name: 'Markdown',
  supports: ['md', 'markdown'],
  setup: pack => {
    let md = null;
    pack.conf({
      inactive_modules: [],
      active_modules: []
    });

    pack.render = (text) => {
      return md.render(text);
    };

    pack.on('enable', () => {
      md = new require('markdown-it')({
        typographer: true,
        modifyToken: function(token, env) {
          if (token.type == 'image') {
            if ((/.uxf$/gi).test(token.attrObj.src)) {
              token.tag = 'uxf-canvas';
            }
          }
        }
      });
      md.use(require('markdown-it-task-lists'));
      md.use(require('markdown-it-inject-linenumbers'));
      md.use(require('markdown-it-anchor'), {permalink: false});
      md.use(require('markdown-it-underline'));
      md.use(require('markdown-it-attrs'));
      md.use(require('markdown-it-table-of-contents'), {"includeLevel": [1,2,3,4,5,6,7]});
      md.use(require('markdown-it-deflist'));
      md.use(require('markdown-it-sup'));
      md.use(require('markdown-it-ins'));
      md.use(require('markdown-it-imsize'));
      md.use(require('markdown-it-footnote'));
      md.use(require('markdown-it-emoji'));
      md.use(require('markdown-it-container'), 'warning');
      md.use(require('markdown-it-container'), 'info');
      md.use(require('markdown-it-container'), 'todo');
      md.use(require('markdown-it-container'), 'menu');
      md.use(require('markdown-it-modify-token'));
      md.use(require('markdown-it-multimd-table'), {enableMultilineRows: true});
    });

    pack.on('conf-set', (key, value) => {
    });
    pack.on('disable', () => { });

  }
};
