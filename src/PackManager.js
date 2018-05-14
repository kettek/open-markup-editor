const settings  = require('electron-app-settings');
const m         = require('mithril');
const fs        = require('fs');
const path      = require('path');
const log       = require('electron-log');
const Emitter   = require('./emitter');

function makePackManager(module_name, obj={}) {
  let mm = Emitter(Object.assign({
    packs: [],
    mod_replace_string: "",
    populate: (dir, on_finish=()=>{}) => {
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
            mm.load(path.join(dir, file));
            log.info("  ...OK");
          } catch (e) {
            log.warn("  ...NOKAY");
            log.warn(e);
          }
        });
        on_finish();
      });
    },
    load: filepath => {
      // TODO: full var parsing
      let check = (/^\$`${mm.mod_replace_string}`(.*)/g).exec(filepath);
      if (check) {
        filepath = '../../'+module_name+'/' + check[1];
      }

      try {
        let extension = mm.create(filepath);
        mm.packs.push(extension);
        mm.emit('load', extension);
      } catch (e) {
        throw e;
      }
    },
    setup: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      let extension = mm.packs[index];
      if (extension.did_setup) return true;
      extension.setup(extension);
      extension.did_setup = true;
      return true;
    },
    enable: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      if (mm.packs[index].enabled) return true;
      // Setup if it hasn't been done already
      mm.setup(index);
      // Enable that beezy
      mm.packs[index].enabled = mm.packs[index].emit('enable') === false ? false : true;
      //settings.set(mm.packs[index].key + '.enabled', mm.packs[index].enabled);
    },
    disable: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      if (!mm.packs[index].enabled) return false;
      mm.packs[index].enabled = mm.packs[index].emit('disable') === false ? true : false;
      //settings.set(mm.packs[index].key+'.enabled', mm.packs[index].enabled);
      return true;
    },
    toggle: index => {
      if (index < 0 || index >= mm.packs.length) return;
      if (mm.packs[index].enabled) mm.disable(index);
      else mm.enable(index);
    },
    getByShortName: short_name => {
      return mm.packs.filter(mod => {return mod.short_name == short_name});
    },
    create: filepath => {
      let mod = Emitter(Object.assign({
        short_name: path.basename(filepath),
        name:       '',
        key:        module_name+'.undefined',
        conf_ui:    [],
        did_setup:  false,
        setup:      () => {},
        conf:       (obj, conf_ui) => { },
        reset:      () => { },
        set:        (key, value) => { },
        get:        (key) => { },
        load:       (file) => { },
        unload:     (file) => { }
      }, require(filepath)));
      {
        if (mod.name == "") {
          log.warn('Blank ' + module_name + ' mod name, will use generated or provided short_name.');
          mod.name = mod.short_name;
        }
        mod.key = module_name + '.' + mod.short_name;

        mod.conf = (obj, conf_ui) => {
          mod.conf_default = Object.assign({}, obj);
          settings.set(mod.key, obj, true);
          mod.conf_ui = conf_ui;
        };
        mod.reset = () => {
          mod.set(mod.conf_default);
        }
        mod.set = (key, value) => {
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
          settings.set(mod.key, obj);
          mod.emit('conf-set', key, value);
          m.redraw();
        }
        mod.get = (key=null) => {
          return settings.get(mod.key+(key === null ? '' : '.'+key));
        }
        mod.load = (file) => {
          let type = path.extname(file);
          if (type == '.css') {
            let links = document.getElementsByTagName('head')[0].querySelectorAll('link');
            for (let i = 0; i < links.length; i++) {
              if (links[i].getAttribute('href') == file) return;
            }
            let link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('type', 'text/css');
            link.setAttribute('href', file);
            // Redraw UI on load
            link.addEventListener('load', m.redraw);
            document.getElementsByTagName('head')[0].appendChild(link);
          }
        }
        mod.unload = (file) => {
          let type = path.extname(file);
          if (type == '.css') {
            let links = document.getElementsByTagName('head')[0].querySelectorAll('link');
            for (let i = 0; i < links.length; i++) {
              if (links[i].getAttribute('href') == file) {
                links[i].parentNode.removeChild(links[i]);
                return;
              }
            }
          }
        }
      }
      return mod;
    }
  }, obj));
  return mm;
}

module.exports = makePackManager;
