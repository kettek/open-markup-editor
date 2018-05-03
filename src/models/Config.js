const { ipcRenderer } = require('electron');

const Emitter = require('../emitter.js');

let Config = Emitter({
  synch_lines: true,
  synch_scroll: false,
  editor: {
    update_delay: 250,
  },
  editorpack: '',
  element_settings: {},
  storeElementSettings: (e, v) => {
    let identifier = e.tagName + (e.className ? '.'+e.className : '') + (e.id ? '#' + e.id : '');
    Config.element_settings[identifier] = Config.element_settings[identifier] || {};

    let iterate = (ectx, value) => {
      if (!ectx) return;
      let obj = {};
      if (typeof value === "string") {
        obj[value] = ectx[value];
      } else if (value instanceof Object) {
        for (v in value) {
          obj[v] = iterate(ectx[v], value[v]);
        }
      }
      return obj;
    }
    Config.element_settings[identifier] = Object.assign(Config.element_settings[identifier], iterate(e, v));
    Config.syncSettings();
  },
  setConfig: (value) => {
    Config = Object.assign(Config, value);
  },
  storeConfig: (key, value, is_default=false) => {
    if (typeof value === "string") {
      Config.element_settings[key] = (is_default ? Config.element_settings[key] || value : value);
    } else {
      Config.element_settings[key] = is_default ? Object.assign(value, Config.element_settings[key]||{}) : Config.element_settings[key] = Object.assign(Config.element_settings[key]||{}, value);
    }
  },
  set: (key, value, is_default=false) => {
    //let hierarchy = key.split(/(?<!\\)(?:\\\\)*\./);
    let hierarchy = key.split(/(?:\\)*\./);
    let last_obj = null;
    let last_name = '';
    let obj = Config;
    let target_node = null;
    for (let i = 0; i < hierarchy.length; i++) {
      last_obj = obj;
      last_name = hierarchy[i];
      if (i != hierarchy.length) {
        obj[hierarchy[i]] = obj[hierarchy[i]] || {};
        obj = obj[hierarchy[i]];
      }
    }

    if (typeof value === 'object') {
      last_obj[last_name] = is_default ? Object.assign(value, last_obj[last_name]||{}) : Object.assign(last_obj[last_name]||{}, value);
    } else {
      last_obj[last_name] = is_default ? Config.element_settings[key] || value : value;
    }
    Config.emit('conf-set', key, value);
    ipcRenderer.send("update-settings", {key: "config."+key, value: last_obj[last_name]});
  },
  get: (key="") => {
    if (key == "") {
      return Config;
    }
    //let hierarchy = key.split(/(?<!\\)(?:\\\\)*\./);
    let hierarchy = key.split(/(?:\\)*\./);
    let obj = Config;
    for (let i = 0; i < hierarchy.length; i++) {
      if (!obj) return null;
      obj = obj[hierarchy[i]];
    }
    return obj;
  },
  syncSettings: () => {
    ipcRenderer.send("update-settings", {key: "config.element_settings", value: Config.element_settings});
  }
});
Config.on('conf-add', (obj) => {
});
Config.on('conf-rem', (key) => {
});
Config.on('conf-set', (key, value) => {
});

module.exports = Config;
