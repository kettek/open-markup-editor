const { ipcRenderer } = require('electron');

let Config = {
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
  storeConfig: (key, value) => {
    if (typeof value === "string") {
      Config.element_settings[key] = value;
    } else {
      Config.element_settings[key] = Object.assign(Config.element_settings[key]||{}, value);
    }
  },
  syncSettings: () => {
    ipcRenderer.send("update-settings", {key: "config.element_settings", value: Config.element_settings});
  }
};

module.exports = Config;
