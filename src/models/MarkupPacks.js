const Emitter = require('../emitter.js');

let MarkupPacks = {
  instances: {},
  packs: [
    {
      supports: [".*"],
      instance: (pack) => {
        pack.render = (text) => {
          return text;
        }
      }
    }
  ],
  parseText: (type, text) => {
    return MarkupPacks.getPack(type).render(text);
  },
  createPack: (pack_index=0) => {
    if (pack_index < 0 || pack_index >= MarkupPacks.packs.length) return null;
    let markup_instance = Emitter();
    MarkupPacks.packs[pack_index].create(markup_instance);
    if (markup_instance.load) {
      markup_instance.load();
    }
    return markup_instance;
  },
  getPack: (type) => {
    if (MarkupPacks.instances[type]) return MarkupPacks.instances[type];
    for (let i = MarkupPacks.packs.length-1; i >= 0; i--) {
      for (let j = 0; j < MarkupPacks.packs[i].supports.length; j++) {
        let regex = new RegExp(MarkupPacks.packs[i].supports[j], 'i');
        if (regex.test(type)) {
          return MarkupPacks.instances[type] = MarkupPacks.createPack(i);
        }
      }
    }
    return MarkupPacks.instances[type] = MarkupPacks.createPack(0);
  },
  setPack: (source) => {
    let check = (/^\$OME_MARKUP_PACKS(.*)/g).exec(source);
    if (check) {
      source = '../../markup-packs/' + check[1];
    }
    try {
      MarkupPacks.packs.push(require(source));
    } catch (e) {
      // TODO: Throw some big ol' error
      console.log(e);
    }
  }
}

module.exports = MarkupPacks;
