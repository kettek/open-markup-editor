let CodeMirror = null;

const settings  = require('electron-app-settings');
const fs        = require('fs');
const path      = require('path');

module.exports = {
  name: "CodeMirror",
  themes: [],
  setup: (pack) => {
    // TODO: async
    let files = fs.readdirSync(path.join(__dirname, 'node_modules/codemirror/theme'));
    files.forEach(file => {
      pack.themes.push(file);
    });
    pack.conf({
      'theme_index': 25,
      'theme': 'material'
    }, [
      ['section', {title: "The theme used by CodeMirror"},
        ['select', '', 'theme_index', {
            'onchange': (e) => {
              pack.setConf('theme_index', e.target.selectedIndex);
              pack.setConf('theme', pack.themes[e.target.selectedIndex]);
            }
          },
          () => {
          return pack.themes.map((theme, index) => {
            return ['option', theme, { value: index, selected: pack.getConf('theme') == index ? true : false }]
          })
        }],
        ['label', 'Theme', 'theme_index']
      ]
    ]);
  },
  create: (editor) => {
    editor.theme = editor.getConf('theme');
    function loadTheme(theme) {
      unloadTheme(editor.theme);
      editor.emit('css-load', path.join(__dirname, 'node_modules/codemirror/theme/', theme));
      editor.theme = theme;
      if (editor.cm) {
        editor.cm.setOption('theme', path.basename(editor.theme, '.css'));
        console.log(editor.cm.getOption('theme'));
      }
    }
    function unloadTheme(theme) {
      editor.emit('css-unload', path.join(__dirname, 'node_modules/codemirror/theme/', theme));
    }
    editor.load = (pack) => {
      CodeMirror = require('codemirror');
                   require('codemirror/mode/markdown/markdown');
      editor.emit('css-load', path.join(__dirname, 'node_modules/codemirror/lib/codemirror.css'));
      loadTheme(editor.theme);
      editor.emit('ready');
    };
    editor.unload = () => {
      editor.emit('css-unload', path.join(__dirname, 'node_modules/codemirror/lib/codemirror.css'));
      unloadTheme(editor.theme);
    };
    const newFile = (filename="", content="", mode="markdown") => {
      return {
        doc: CodeMirror.Doc(content, mode)
      }
    }
    editor.focused = -1;
    editor.files = [];
    editor.on('dom-attach', (dom) => {
      if (!editor.cm) {
        editor.cm = CodeMirror.fromTextArea(dom, {
          lineNumbers: true,
          lineWrapping: settings.get('editor.linewrapping') ? true : false,
          theme: path.basename(editor.theme, '.css')
        });
        editor.cm.on("changes", (cm, changes) => {
          editor.emit("change", editor.focused);
        });
        //
        editor.cm.on("cursorActivity", (cm) => {
          editor.emit("line", editor.focused, cm.getDoc().getCursor().line);
        });
        editor.cm.on("viewportChange", (cm, from, to) => {
        });
      }
    });
    editor.on('doc-new', (index, filename) => {
      // Create new document at position in editor list
      editor.files.splice(index, 0, newFile(filename));
    });
    editor.on('doc-set', (index=editor.focused, content) => {
      if (index < 0 || index > editor.files.length-1) return;
      // Set document data at position in editor list
      editor.files[index].doc.setValue(content);
    });
    editor.on('doc-focus', (index=editor.focused) => {
      if (index < 0 || index >= editor.files.length) return;
      // Hide old focus and bring target document into focus
      editor.cm.swapDoc(editor.files[index].doc);
      editor.focused = index;
    });
    editor.on('doc-close', (index=editor.focused) => {
      if (index < 0 || index > editor.files.length-1) return;
      // Close document at position in editor list
      editor.files.splice(index, 1);
    });
    editor.on('doc-move', (index=editor.focused, insertion_point) => {
      if (index < 0 || index > editor.files.length-1) return;
      // Reposition document at position to insertion point
    });
    // Override main text handling
    editor.getText = (index) => {
      if (index < 0 || index > editor.files.length-1) return;
      return editor.files[index].doc.getValue();
    };
    /* --- */
    editor.on('global-conf-set', (key, value) => {
      if (key === 'editor.linewrapping') {
        editor.cm.setOption('lineWrapping', value);
      }
    });
    editor.on('conf-set', (key, value) => {
      if (key === 'theme') {
        loadTheme(value);
      }
    });
  }
}
