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
      active_libraries: pack.libraries.map((lib, index) => {
        return lib.name;
      })
    },
    ['section', {title: "Available and active markdown-it libraries"},
      ['listbuilder', '', '', {
        left_items: () => {
          let active = pack.get('active_libraries');
          return pack.libraries.reduce( (list, item) => {
            if (active.indexOf(item.name) === -1) {
              list.push(item.name);
            }
            return list;
          }, [])
        },
        right_items: () => {
          let active = pack.get('active_libraries');
          return pack.libraries.reduce( (list, item) => {
            if (active.indexOf(item.name) !== -1) {
              list.push(item.name);
            }
            return list;
          }, [])
        },
        onchange: (e) => {
          pack.set('active_libraries', e.right_items);
        }
      }],
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
      let active = pack.get('active_libraries');
      for (let i = 0; i < active.length; i++) {
        let index = pack.libraries.map( d => {return d.name}).indexOf(active[i]);
        if (index == -1) continue;
        md.use(require(pack.libraries[index].src), pack.libraries[index].args);
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
      createMD();
    });
    pack.on('disable', () => { });

  }
};
