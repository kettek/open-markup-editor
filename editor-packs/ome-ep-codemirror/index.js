let CodeMirror = null;

const settings  = require('electron-app-settings');
const fs        = require('fs');
const path      = require('path');

module.exports = {
  name: "CodeMirror",
  themes: [],
  keymaps: ['default'],
  setup: (pack) => {
    // TODO: async
    let files = fs.readdirSync(path.join(__dirname, 'node_modules/codemirror/theme'));
    files.forEach(file => {
      pack.themes.push(path.basename(file, '.css'));
    });
    files = fs.readdirSync(path.join(__dirname, 'node_modules/codemirror/keymap'));
    files.forEach(file => {
      pack.keymaps.push(path.basename(file, '.js'));
    });

    pack.conf({
      'theme_index': 25,
      'theme': 'material',
      'keymap_index': 0,
      'keymap': 'default'
    }, [
      ['section', {title: "The theme used by CodeMirror"},
        ['select', '', 'theme_index', {
            'onchange': (e) => {
              pack.set('theme_index', e.target.selectedIndex);
              pack.set('theme', pack.themes[e.target.selectedIndex]);
            }
          },
          () => {
          return pack.themes.map((theme, index) => {
            return ['option', theme, { value: index, selected: pack.get('theme') == index ? true : false }]
          })
        }],
        ['label', 'Theme', 'theme_index']
      ],
      ['section', {title: "The key map (keyboard control) used by CodeMirror"},
        ['select', '', 'keymap_index', {
            'onchange': (e) => {
              pack.set('keymap_index', e.target.selectedIndex);
              pack.set('keymap', pack.keymaps[e.target.selectedIndex]);
            }
          },
          () => {
          return pack.keymaps.map((keymap, index) => {
            return ['option', keymap, { value: index, selected: pack.get('keymap') == index ? true : false }]
          })
        }],
        ['label', 'Key map', 'keymap_index']
      ],
    ]);

    pack.theme = pack.get('theme');
    pack.keymap = pack.get('keymap');

    function loadTheme(theme) {
      unloadTheme(pack.theme);
      pack.load(path.join(__dirname, 'node_modules/codemirror/theme/', theme+'.css'));
      pack.theme = theme;
      if (pack.cm) {
        pack.cm.setOption('theme', pack.theme);
      }
    }
    function unloadTheme(theme) {
      pack.unload(path.join(__dirname, 'node_modules/codemirror/theme/', theme+'.css'));
    }
    function loadKeymap(keymap) {
      if (keymap !== 'default') {
        require(path.join('codemirror/keymap/', keymap + ".js"));
      }
      pack.keymap = keymap;
      if (pack.cm) {
        pack.cm.setOption('keyMap', pack.keymap);
      }
    }
    pack.on('enable', () => {
      if (!CodeMirror) {
        CodeMirror = require('codemirror');
        require('codemirror/mode/markdown/markdown');
      }
      pack.load(path.join(__dirname, 'node_modules/codemirror/lib/codemirror.css'));
      loadTheme(pack.theme);
      loadKeymap(pack.keymap);
      pack.emit('ready');
    });
    pack.on('disable', () => {
      pack.unload(path.join(__dirname, 'node_modules/codemirror/lib/codemirror.css'));
      unloadTheme(pack.theme);
    });
    const newFile = (filename="", content="", mode="markdown") => {
      return {
        doc: CodeMirror.Doc(content, mode)
      }
    }
    pack.focused = -1;
    pack.files = [];
    pack.on('dom-attach', (dom) => {
      if (!pack.cm) {
        pack.cm = CodeMirror.fromTextArea(dom, {
          lineNumbers: true,
          lineWrapping: settings.get('pack.linewrapping') ? true : false,
          theme: pack.theme,
          keyMap: pack.keymap
        });
        pack.cm.on("changes", (cm, changes) => {
          pack.emit("change", pack.focused);
        });
        //
        pack.cm.on("cursorActivity", (cm) => {
          pack.emit("line", pack.focused, cm.getDoc().getCursor().line);
        });
        pack.cm.on("viewportChange", (cm, from, to) => {
        });
      }
    });
    pack.on('dom-detach', (dom) => {
      pack.cm.toTextArea();
      pack.cm = null;
    });
    pack.on('doc-new', (index, filename) => {
      // Create new document at position in editor list
      pack.files.splice(index, 0, newFile(filename));
    });
    pack.on('doc-set', (index=pack.focused, content) => {
      if (index < 0 || index > pack.files.length-1) return;
      // Set document data at position in editor list
      pack.files[index].doc.setValue(content);
    });
    pack.on('doc-focus', (index=pack.focused) => {
      if (index < 0 || index >= pack.files.length) return;
      // Hide old focus and bring target document into focus
      pack.cm.swapDoc(pack.files[index].doc);
      pack.focused = index;
    });
    pack.on('doc-close', (index=pack.focused) => {
      if (index < 0 || index > pack.files.length-1) return;
      // Close document at position in editor list
      pack.files.splice(index, 1);
    });
    pack.on('doc-move', (index=pack.focused, insertion_point) => {
      if (index < 0 || index > pack.files.length-1) return;
      // Reposition document at position to insertion point
    });
    // Override main text handling
    pack.getText = (index) => {
      if (index < 0 || index > pack.files.length-1) return;
      return pack.files[index].doc.getValue();
    };
    /* --- */
    pack.on('global-conf-set', (key, value) => {
      if (key === 'editor.linewrapping') {
        pack.cm.setOption('lineWrapping', value);
      }
    });
    pack.on('conf-set', (key, value) => {
      if (key === 'theme') {
        loadTheme(value);
      }
      if (key === 'keymap') {
        loadKeymap(value);
      }
    });
  }
}
