const Emitter = require('./emitter');
const settings = require('electron-app-settings');
const m       = require('mithril');
const fs      = require('fs');
const path    = require('path');
const log     = require('electron-log');

const Extensions = {
  list: [],
  populateExtensionsList: (dir, on_finish=()=>{}) => {
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
          Extensions.loadExtension(path.join(dir, file));
          log.info("  ...OK");
        } catch (e) {
          log.warn("  ...NOKAY");
          log.warn(e);
        }
      });
      on_finish();
    });
  },
  getExtensionIndexByShortName: short_name => {
    return Extensions.list.filter(extension => {return extension.short_name == short_name});
  },
  loadExtension: filepath => {
    try {
      let extension = Emitter(require(filepath));
      extension.conf_ui = [];
      extension.did_setup = false;
      extension.short_name = extension.short_name || path.basename(filepath);
      if (!extension.name) {
        console.log('Warning, no extension name provided, will use generated or provided short_name.');
        extension.name = extension.short_name;
      }
      if (!extension.setup) {
        console.log("Warning, no extension setup provided. I hope you know what you're doing.");
        extension.setup = ()=>{};
      }
      extension.conf = (obj, conf_ui) => {
        extension.conf_default = Object.assign({}, obj);
        settings.set('extensions.'+extension.short_name, obj, true);
        extension.conf_ui = conf_ui;
      }
      extension.reset = () => {
        extension.setConf(extension.conf_default);
      }
      // setConf(KEY), setConf(KEY, VALUE), setConf(OBJ)
      extension.setConf = (key, value) => {
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
        settings.set('extensions.'+extension.short_name, obj);
        extension.emit('conf-set', key, value);
        m.redraw();
      }
      extension.getConf = (key=null) => {
        return settings.get('extensions.'+extension.short_name+(key === null ? '' : '.'+key));
      }
      Extensions.list.push(extension);
    } catch (e) {
      throw e;
    }
  },
  setupExtension: index => {
    let extension = Extensions.list[index];
    if (extension.did_setup) return;
    extension.setup(extension);
    extension.did_setup = true;
  },
  enableExtension: index => {
    if (index < 0 || index >= Extensions.list.length) return;
    if (Extensions.list[index].enabled) return;
    // Setup if it hasn't been done already
    Extensions.setupExtension(index);
    // Enable that beezy
    Extensions.list[index].enabled = Extensions.list[index].emit('enable') === false ? false : true;
    settings.set('extensions.'+Extensions.list[index].short_name+'.enabled', Extensions.list[index].enabled);
  },
  disableExtension: index => {
    if (index < 0 || index >= Extensions.list.length) return;
    if (!Extensions.list[index].enabled) return;
    Extensions.list[index].enabled = Extensions.list[index].emit('disable') === false ? true : false;
    settings.set('extensions.'+Extensions.list[index].short_name+'.enabled', Extensions.list[index].enabled);
  },
  toggleExtension: index => {
    if (index < 0 || index >= Extensions.list.length) return;
    if (Extensions.list[index].enabled) Extensions.disableExtension(index);
    else Extensions.enableExtension(index);
  }
};

module.exports = Extensions;
