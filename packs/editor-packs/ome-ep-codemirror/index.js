let CodeMirror = null;

const fs        = require('fs');
const path      = require('path');

module.exports = {
  name: "CodeMirror",
  themes: [],
  keymaps: ['default'],
  search_addons: ['search/search.js', 'search/searchcursor.js', 'search/jump-to-line.js', 'dialog/dialog.js'],
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
      'keymap': 'default',
      'use_tabs': false,
      'indent_size': 2,
      'spellchecker': false,
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
      ['section', {title: "Whether to use spaces or tabs for the Tab key"},
        ['checkbox', '', 'use_tabs', {
            'onchange': (e) => {
              pack.set('use_tabs', e.target.checked);
            }
          }
        ],
        ['label', 'Use tabs', 'use_tabs']
      ],
      ['section', {title: "Indentation size, whether spaces or tabs"},
        ['number', '', 'indent_size', {
            'min': 1,
            'max': 16,
            'onchange': (e) => {
              pack.set('indent_size', Number(e.target.value));
            }
          }
        ],
        ['label', 'Indentation Size', 'indent_size']
      ],
      ['section', {title: "Experimental spellchecker support. Restart or close all open files for changes to take effect. Works best with default key map."},
        ['checkbox', '', 'spellchecker', {
            'onchange': (e) => {
              pack.set('spellchecker', e.target.checked);
            }
          }
        ],
        ['label', 'Spellchecker (experimental)', 'spellchecker']
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
    function enableSearch() {
      for (let addon of pack.search_addons) {
        require('codemirror/addon/'+addon)
      }
      pack.load(path.join(__dirname, 'node_modules/codemirror/addon/dialog/dialog.css'));
    }
    function disableSearch() {
      for (let addon of pack.search_addons) {
        delete require.cache[require.resolve('codemirror/addon/'+addon)]
      }
      pack.unload(path.join(__dirname, 'node_modules/codemirror/addon/dialog/dialog.css'));
    }
    function unloadCustomTheming() {
      let style = document.getElementsByTagName('head')[0].querySelector('#ome-ep-codemirror');
      if (style) style.parentNode.removeChild(style);
    }
    function loadCustomTheming() {
      // Only load our theming overrides if the Font Manager extension is loaded.
      let fm_style = document.getElementsByTagName('head')[0].querySelector('#OME-FontManager');
      if (!fm_style) return;
      // Let's build our CSS!
      let css = '\n.CodeMirror {\n';
      for (let i = 0; i < fm_style.sheet.rules[0].style.length; i++) {
        switch(fm_style.sheet.rules[0].style[i]) {
          case "--editor-font-family":
            css += '\tfont-family: var(--editor-font-family);\n';
            break;
          case "--editor-font-size":
            css += '\tfont-size: var(--editor-font-size);\n';
            break;
          case "--editor-font-color":
            css += '\tcolor: var(--editor-font-color) !important;\n';
            break;
        }
      }
      css += '\n}\n';
      // Append to the head!
      let style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.appendChild(document.createTextNode(css));
      style.setAttribute('id', 'ome-ep-codemirror');
      document.getElementsByTagName('head')[0].appendChild(style);
    }
    pack.on('enable', () => {
      if (!CodeMirror) {
        CodeMirror = require('codemirror');
        require('codemirror/mode/meta');
      }
      pack.load(path.join(__dirname, 'node_modules/codemirror/lib/codemirror.css'));
      enableSearch();
      loadTheme(pack.theme);
      loadKeymap(pack.keymap);
      loadCustomTheming();
      pack.emit('ready');
    });
    pack.on('disable', () => {
      disableSearch();
      pack.unload(path.join(__dirname, 'node_modules/codemirror/lib/codemirror.css'));
      unloadTheme(pack.theme);
      unloadCustomTheming();
    });
    const newFile = (filename="", content="", mode="markdown") => {
      let meta_info = CodeMirror.findModeByFileName(filename);
      if (meta_info) {
        try {
          require(path.join('codemirror/mode/', meta_info.mode, meta_info.mode))
          mode = meta_info.mode;
        } catch(e) {
          console.log('No mode supported for ', meta_info)
        }
      }
      return {
        doc: CodeMirror.Doc(content, mode)
      }
    }
    pack.focused = -1;
    pack.files = [];
    pack.parentTarget = null;
    pack.oldTarget = null;
    pack.on('dom-attach', (dom) => {
      if (!pack.cm) {
        let options = {
          lineNumbers: true,
          lineWrapping: pack.getGlobal('editor.linewrapping') ? true : false,
          theme: pack.theme,
          keyMap: pack.keymap,
          spellcheck: true
        }
        if (pack.get('spellchecker') == true) {
          options.inputStyle = "contenteditable"
          pack.parentTarget = dom.parentNode
          pack.oldTarget = dom
          pack.parentTarget.removeChild(pack.oldTarget)
          pack.cm = CodeMirror(pack.parentTarget, options)
        } else {
          pack.cm = CodeMirror.fromTextArea(dom, options)
        }
        pack.cm.on("changes", (cm, changes) => {
          pack.emit("change", pack.focused);
        });
        //
        pack.cm.on("cursorActivity", (cm) => {
          let cursor = cm.getDoc().getCursor()
          pack.emit("line", pack.focused, cursor.line);
          cm.scrollIntoView(cursor);
        });
        pack.cm.on("viewportChange", (cm, from, to) => {
        });
        pack.cm.addKeyMap({
					Tab: (cm) => {
	          if (cm.somethingSelected()) {
	            cm.indentSelection("add");
	            return;
	          }
	
	          if (pack.get('use_tabs') == true) {
	            cm.replaceSelection("\t", "end", "+input");
	          } else {
	            cm.execCommand("insertSoftTab");
						}
	        },
	        "Shift-Tab": (cm) => {
	          cm.indentSelection("subtract");
	        }
        });
      }
    });
    pack.on('dom-detach', (dom) => {
      if (pack.cm.options.inputStyle == 'contenteditable') {
        let el = pack.cm.getWrapperElement()
        el.parentNode.removeChild(el);
        pack.parentTarget.appendChild(pack.oldTarget);
        pack.parentTarget = pack.oldTarget = null;
      } else {
        pack.cm.toTextArea();
      }
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
    pack.on('doc-insert', (index=pack.focused, content) => {
      if (index < 0 || index > pack.files.length-1) return;
      // Insert new document data at cursor
      let selection = pack.files[index].doc.getSelection();
      pack.files[index].doc.replaceSelection(content, selection);
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
        if (pack.cm) pack.cm.setOption('lineWrapping', value);
      } else if (key === 'editor.updateTheming') { // FIXME: this is hacky to use a configuration to propagate updates.
        unloadCustomTheming();
        loadCustomTheming();
      }
    });
    pack.on('conf-set', (key, value) => {
      if (key === 'theme') {
        loadTheme(value);
      }
      if (key === 'keymap') {
        loadKeymap(value);
      }
      if (key === 'use_tabs') {
        pack.cm.setOption('indentWithTabs', value);
      }
      if (key === 'indent_size') {
        pack.cm.setOption('tabSize', value);
      }
    });
  }
}
