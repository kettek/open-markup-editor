let md = null;

module.exports = {
  name: 'markdown-it',
  supports: ['md', 'markdown'],
  libraries: [
    { name: 'Task Lists', desc: '', cheat: '[ ] Task item\n[x] Task item', src: 'markdown-it-task-lists' }
    , { name: 'Line Numbering', desc: '', cheat: '', src: 'markdown-it-inject-linenumbers' }
    , { name: 'Header Anchors', desc: '', cheat: '', src: 'markdown-it-anchor', args: {permalink: false} }
    , { name: 'Underlining', desc: '', cheat: '', src: 'markdown-it-underline' }
    , { name: 'HTML Attributes', desc: '', cheat: '', src: 'markdown-it-attrs' }
    , { name: 'Table of Contents', desc: '', cheat: '', src: 'markdown-it-table-of-contents', args: {"includeLevel": [1,2,3,4,5,6,7]} }
    , { name: 'Definitions List', desc: '', cheat: '', src: 'markdown-it-deflist' }
    , { name: 'Super text', desc: '', cheat: '', src: 'markdown-it-sup' }
    , { name: 'Inserted tags', desc: '', cheat: '', src: 'markdown-it-ins' }
    , { name: 'Image sizing', desc: '', cheat: '', src: 'markdown-it-imsize' }
    , { name: 'Footnotes', desc: '', cheat: '', src: 'markdown-it-footnote' }
    , { name: 'Emoji', desc: '', cheat: '', src: 'markdown-it-emoji' }
    , { name: 'MultiMarkdown tables', desc: '', cheat: '', src: 'markdown-it-multimd-table', args: {enableMultilineRows: true} }
  ],
  setup: pack => {
    let md = null;
    pack.conf({
      inactive_libraries: [],
      active_libraries: pack.libraries.map((lib, index) => {
        return index;
      })
    },
    ['section', {title: "Available and active markdown-it libraries"},
      ['select', '', 'disabled', {
          'onchange': (e) => {
          },
          'size': () => { return pack.libraries.length }
        },
        () => {
        return pack.libraries.map((lib, index) => {
          return ['option', lib.name, { value: index }]
        })
      }],
      ['select', '', 'enabled', {
          'onchange': (e) => {
          },
          'size': () => { return pack.libraries.length }
        },
        () => {
        return pack.get('active_libraries').map((lib, index) => {
          return ['option', pack.libraries[lib].name, { value: index }]
        })
      }]
    ]);

    pack.render = (text) => {
      return md.render(text);
    };

    function createMD() {
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
      for (let i = 0; i < pack.libraries.length; i++) {
        md.use(require(pack.libraries[i].src, pack.libraries[i].args));
      }
      md.use(require('markdown-it-container'), 'warning');
      md.use(require('markdown-it-container'), 'info');
      md.use(require('markdown-it-container'), 'todo');
      md.use(require('markdown-it-container'), 'menu');
      md.use(require('markdown-it-modify-token'));
    }

    pack.on('enable', () => {
      createMD();
    });

    pack.on('conf-set', (key, value) => {
    });
    pack.on('disable', () => { });

  }
};
