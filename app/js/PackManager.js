const settings    = require('electron-app-settings');
const m           = require('mithril');
const fs          = require('fs');
const path        = require('path');
const log         = require('electron-log');
const https       = require('https');
const DataManager = require('./DataManager');
const Emitter     = require('./emitter');

function makePackManager(module_name, obj={}) {
  let mm = Emitter(Object.assign({
    packs: [],
    // Packs that are pending loading. For each pack detected by populate, a number is added to this. For each pack that finishes loading, successfully or not, this number is decreased. When it reaches 0, "populated" is emitted.
    pending_packs: 0,
    reducePendingPacks: (on_finish) => {
      mm.pending_packs = mm.pending_packs - 1;
      if (mm.pending_packs <= 0) {
        on_finish();
      }
    },
    mod_replace_string: "",
    populate: (dir, on_finish=()=>{}) => {
      DataManager.getFiles(dir, (errors, data_files) => {
        mm.pending_packs += data_files.length
        data_files.forEach(data_file => {
          log.info(" Loading " + data_file.fullpath + "...");
          try {
            fs.accessSync(path.join(data_file.fullpath, 'package.json'), fs.constants.F_OK);
          } catch (err) {
            log.warn("  ...ignoring, missing 'package.json'.");
            mm.reducePendingPacks(on_finish);
            return;
          }

          try {
            mm.load(data_file, () => {
              mm.reducePendingPacks(on_finish);
            });
            log.info("  ...OK");
          } catch (e) {
            mm.reducePendingPacks(on_finish);
            log.warn("  ...NOKAY");
            log.warn(e);
          }
        });
      });
    },
    load: (data_file, on_packload=()=>{}) => {
      try {
        let extension = mm.create(data_file.fullpath);
        extension.read_only = DataManager.paths[DataManager.paths.map(o => o.path).indexOf(data_file.root)].writable ? false : true;
        mm.packs.push(extension);
        mm.emit('load', extension);
        on_packload(extension)
      } catch (e) {
        throw e;
      }
    },
    unload: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      let extension = mm.packs[index];
      mm.disable(index);
      mm.emit('unload', extension);
      mm.packs.splice(index, 1);
      m.redraw();
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
      // Hook pack into global settings if it is listening for it
      if (mm.packs[index].on['global-conf-set']) {
        mm.packs[index]._global_conf_set = (arg) => {
          mm.packs[index].emit('global-conf-set', arg.key, arg.value, arg.is_default);
        };
        settings.on('set', mm.packs[index]._global_conf_set);
      }
      //settings.set(mm.packs[index].key + '.enabled', mm.packs[index].enabled);
    },
    disable: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      if (!mm.packs[index].enabled) return false;
      mm.packs[index].enabled = mm.packs[index].emit('disable') === false ? true : false;
      //settings.set(mm.packs[index].key+'.enabled', mm.packs[index].enabled);
      if (mm.packs[index]._global_conf_set) {
        settings.off('set', mm.packs[index]._global_conf_set);
        delete mm.packs[index]._global_conf_set;
      }

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
      let pkg = JSON.parse(fs.readFileSync(path.join(filepath, 'package.json'), 'utf8'))
      let mod = Emitter(Object.assign({
        short_name: pkg.name,
        repository: pkg.repository ? pkg.repository : '',
        version:    '',
        filepath:   filepath,
        name:       '',
        key:        module_name+'.undefined',
        conf_ui:    [],
        did_setup:  false,
        setup:      () => {},
        conf:       (obj, conf_ui) => { },
        reset:      () => { },
        set:        (key, value) => { },
        get:        (key) => { },
        setGlobal:  (key, value) => { },
        getGlobal:  (key) => { },
        load:       (file) => { },
        unload:     (file) => { }
      }, require(filepath)));
      {
        if (mod.name == "") {
          log.warn('Blank ' + module_name + ' mod name, will use generated or provided short_name.');
          mod.name = mod.short_name;
        }
        if (mod.version == "") {
          mod.version = pkg.version
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
        mod.setGlobal = (key, value) => {
          settings.set(key, value);
          m.redraw();
        }
        mod.getGlobal = (key) => {
          return settings.get(key)
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
        mod.on('redraw', () => {
          m.redraw();
        });
      }
      return mod;
    },
    install: files => {
      if (!files || files.length == 0) return;
      let file = files[0];
      DataManager.unpackFile(file, path.join('packs', module_name), (err, pack_path) => {
        if (err) {
          alert(err);
        } else {
          try {
            mm.load(pack_path);
            log.info("  ...OK");
          } catch (e) {
            log.warn("  ...NOKAY");
            log.warn(e);
          }
          m.redraw();
        }
      });
    },
    uninstall: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      DataManager.deleteDirectory(mm.packs[index].filepath, err => {
        if (err) {
          alert(err);
        } else {
          mm.unload(index);
        }
      });
    },
    checkForUpdate: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      //
      let full = mm.packs[index].repository
      let user = ''
      let repo = ''
      // Figure out our repository type.
      if (full.startsWith('github:')) {
        full = full.substring('github:'.length)
        let parts = full.split('/', 2)
        user = parts[0]
        repo = parts[1]
      } else {
        let url = new URL(full)
        let parts = url.pathname.split('/', 2)
        user = parts[0]
        repo = parts[1].replace(/\.git$/, '') 
      }
      if (user == '' || repo == '') {
        log.warn(`Could not get user or repo for updating`)
        return
      }
      // Now we can request an update
      https.get(`https://api.github.com/repos/${user}/${repo}/releases/latest`, {
        json: true,
        headers: {
          "User-Agent": "Open Markup Editor"
        }
      }, (res) => {
        if (res.statusCode !== 200) {
          log.error(res.statusCode, res.statusMessage)
          return
        }
        let str = ''
        res.on('data', chunk => {
          str += chunk
        })
        res.on('end', () => {
          let result = JSON.parse(str)
          // TODO: Use result.tag_name to check semver against our own package version
          // TODO: Iterate through result.assets and check first for platform-specific releases. If no specifics, use a non-platform suffixed version.
          console.log(result)
        })
      }).end();
    },
  }, obj));
  return mm;
}

module.exports = makePackManager;
