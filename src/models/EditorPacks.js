const Emitter = require('../emitter.js');
const fs      = require('fs');
const path    = require('path');
const log     = require('electron-log');
const settings = require('electron-app-settings');

const m = require('mithril');

let EditorPacks = {
  packs: [
  ],
  createEditor: (pack_index=0) => {
    if (pack_index < 0 || pack_index >= EditorPacks.packs.length) return null;
    let editor_instance = Emitter();

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
    // NOTE: It seems messy to attach to the settings object directly here.
    settings.on('set', (args) => {
      editor_instance.emit('global-conf-set', args.key, args.value, args.is_default);
    });
    EditorPacks.packs[pack_index].on('conf-set', (key, value) => {
      editor_instance.emit('conf-set', key, value);
    });
    editor_instance.setConf = EditorPacks.packs[pack_index].setConf;
    editor_instance.getConf = EditorPacks.packs[pack_index].getConf;

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
      let pack = Emitter(require(source));
      EditorPacks.packs.push(pack);

      pack.short_name = pack.short_name || path.basename(source);
      if (!pack.name) {
        console.log('Warning, no pack name provided, will use generated or provided short_name.');
        pack.name = pack.short_name;
      }
      if (!pack.setup) {
        console.log("Warning, no pack setup provided. I hope you know what you're doing.");
        pack.setup = ()=>{};
      }
      pack.conf = (obj, conf_ui) => {
        pack.conf_default = Object.assign({}, obj);
        settings.set('editorpacks.'+pack.short_name, obj, true);
        pack.conf_ui = conf_ui;
      }
      pack.reset = () => {
        pack.setConf(pack.conf_default);
      }
      // setConf(KEY), setConf(KEY, VALUE), setConf(OBJ)
      pack.setConf = (key, value) => {
        let obj = {};
        if (value === undefined) {
          if (typeof key === 'object') {
            obj = key;
          } else { // flag
            value = true;
          }
        } else {
          obj[key] = value;
        }
        settings.set('editorpacks.'+pack.short_name, obj);
        pack.emit('conf-set', key, value);
        m.redraw();
      }
      pack.getConf = (key=null) => {
        return settings.get('editorpacks.'+pack.short_name+(key === null ? '' : '.'+key));
      }

      pack.setup(pack);
    } catch (e) {
      throw e;
    }
  }

};

module.exports = EditorPacks;
