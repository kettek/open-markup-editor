const MM = require('./PackManager');

const MarkupPackManager = MM('markup-packs', {
  cached_packs: {},
  parseText: (type, text) => {
    let pack = MarkupPackManager.getMarkup(type);
    if (!pack) return text;
    return pack.render(text);
  },
  getMarkup: (type) => {
    if (MarkupPackManager.cached_packs[type]) {
      return MarkupPackManager.packs[MarkupPackManager.cached_packs[type]];
    }
    for (let i = MarkupPackManager.packs.length-1; i >= 0; i--) {
      for (let j = 0; j < MarkupPackManager.packs[i].supports.length; j++) {
        let regex = new RegExp(MarkupPackManager.packs[i].supports[j], 'i');
        if (regex.test(type)) {
          MarkupPackManager.cached_packs[type] = i;
          return MarkupPackManager.packs[i];
        }
      }
    }
    return MarkupPackManager.packs[0];
  },
  mod_replace_string: "$OME_MARKUP_PACKS"
});

module.exports = MarkupPackManager;
