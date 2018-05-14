module.exports = {
  name: 'markdown-it',
  supports: ['md', 'markdown'],
  libraries: [
    { name: 'Task Lists', desc: 'Adds support for Github-style tasklists.', example: '[ ] Task item\n[x] Task item', src: 'markdown-it-task-lists' }
    , { name: 'Line Numbering', desc: 'Adds line numbering ids, required for synch-to-line.', example: '', src: 'markdown-it-inject-linenumbers' }
    , { name: 'Header Anchors', desc: 'Adds anchors to headers.', example: '', src: 'markdown-it-anchor', args: {permalink: false} }
    , { name: 'Underlining', desc: 'Adds support for underlining text', example: '', src: 'markdown-it-underline' }
    , { name: 'HTML Attributes', desc: 'Allows specifying of HTML attributes to markup.', example: '', src: 'markdown-it-attrs' }
    , { name: 'Table of Contents', desc: 'Adds Table of Contents support', example: '', src: 'markdown-it-table-of-contents', args: {"includeLevel": [1,2,3,4,5,6,7]} }
    , { name: 'Definitions List', desc: 'Adds definitions lists.', example: '', src: 'markdown-it-deflist' }
    , { name: 'Superscript', desc: 'Adds superscript syntax support.', example: '', src: 'markdown-it-sup' }
    , { name: 'Inserted tags', desc: '', example: '', src: 'markdown-it-ins' }
    , { name: 'Image sizing', desc: 'Allows custom sizing of images.', example: '', src: 'markdown-it-imsize' }
    , { name: 'Footnotes', desc: 'Adds footnotes syntax.', example: '', src: 'markdown-it-footnote' }
    , { name: 'Emoji', desc: 'Adds Github-style emojis.', example: '', src: 'markdown-it-emoji' }
    , { name: 'MultiMarkdown tables', desc: 'Adds MultiMarkdown-style table support.', example: '', src: 'markdown-it-multimd-table', args: {enableMultilineRows: true} }
  ],
  setup: pack => {
    let md = null;
    pack.conf({
      active_libraries: pack.libraries.map((lib, index) => {
        return lib.name;
      })
    },
    ['section', {title: "Available and active markdown-it plugins"},
      ['listbuilder', '', '', {
        left_items: () => {
          let active = pack.get('active_libraries');
          return pack.libraries.reduce( (list, item) => {
            if (active.indexOf(item.name) === -1) {
              list.push({name: item.name, title: item.desc});
            }
            return list;
          }, [])
        },
        right_items: () => {
          let active = pack.get('active_libraries');
          return pack.libraries.reduce( (list, item) => {
            if (active.indexOf(item.name) !== -1) {
              list.push({name: item.name, title: item.desc});
            }
            return list;
          }, [])
        },
        onchange: (e) => {
          pack.set('active_libraries', e.right_items.map(item => { return item.name; }));
        }
      }],
      ['label', 'Plugins', ''],
    ]);

    pack.render = (text) => {
      return md.render(text);
    };

    pack.cheatsheet = () => {
      let cheatsheet = '';
      let active = pack.get('active_libraries');
      for (let i = 0; i < active.length; i++) {
        let index = pack.libraries.map( d => {return d.name}).indexOf(active[i]);
        if (index == -1) continue;
        cheatsheet += '##' + pack.libraries[index].name + '\n' + pack.libraries[index].example + '\n\n';
      }
      return {
        text: cheatsheet,
        html: pack.render(cheatsheet)
      }
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
