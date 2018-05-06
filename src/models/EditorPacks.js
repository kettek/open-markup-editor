const Emitter = require('../emitter.js');
const fs      = require('fs');
const path    = require('path');
const log     = require('electron-log');

const m = require('mithril');

let EditorPacks = {
  packs: [
  ],
  createEditor: (pack_index=0) => {
    if (pack_index < 0 || pack_index >= EditorPacks.packs.length) return null;
    let editor_instance = Emitter();
    editor_instance.conf_ui = [];
    editor_instance.conf = (obj, conf_ui) => {
      editor_instance.conf_default = Object.assign({}, obj);
      editor_instance.conf_ui = conf_ui;
    }

    editor_instance.on('css-load', css => {
      // TODO: Move this code to a generic css loader/unloader
      let links = document.getElementsByTagName('head')[0].querySelectorAll('link');
      for (let i = 0; i < links.length; i++) {
        if (links[i].getAttribute('href') == css) return;
      }
      let link = document.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('type', 'text/css');
      link.setAttribute('href', css);
      // Redraw UI on load
      link.addEventListener('load', m.redraw);
      document.getElementsByTagName('head')[0].appendChild(link);
    });
    editor_instance.on('css-unload', css => {
      let links = document.getElementsByTagName('head')[0].querySelectorAll('link');
      for (let i = 0; i < links.length; i++) {
        if (links[i].getAttribute('href') == css) {
          links[i].parentNode.removeChild(links[i]);
          return;
        }
      }
    });
    editor_instance.on('ready', () => {
      m.redraw();
    });
    EditorPacks.packs[pack_index].create(editor_instance);
    if (editor_instance.load) {
      editor_instance.load();
    }
    return editor_instance
  },
  loadPacksFromDir: (dir, on_finish=()=>{}) => {
    fs.readdir(dir, (err, files) => {
      files.forEach(file => {
        log.info(" Loading " + file + "...");
        try {
          fs.accessSync(path.join(dir, file, 'package.json'), fs.constants.F_OK);
        } catch (err) {
          log.warn("  ...ignoring, missing 'package.json'.");
          return;
        }

        try {
          EditorPacks.loadPack(path.join(dir, file));
          log.info("  ...OK");
        } catch (e) {
          log.warn("  ...NOKAY");
          log.warn(e);
        }
      });
      on_finish();
    });
  },
  loadPack: (source) => {
    let check = (/^\$OME_EDITOR_PACKS(.*)/g).exec(source);
    if (check) {
      source = '../../editor-packs/' + check[1];
    }
    try {
      EditorPacks.packs.push(require(source));
    } catch (e) {
      throw e;
    }
  }

};

module.exports = EditorPacks;
