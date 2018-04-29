let Config = {
  synch_lines: true,
  synch_scroll: false,
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
  }
};

module.exports = Config;
