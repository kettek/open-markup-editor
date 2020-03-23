const MM = require('./PackManager');

const MarkupPackManager = MM('markup-packs', {
  pack_type: 'markup',
  pack_type_short: 'mp',
  cached_packs: {},
  parseText: (type, text) => {
    let pack = MarkupPackManager.getMarkup(type);
    if (!pack) return text;
    return pack.render(text);
  },
  getGroupNameForExtension: (ext) => {
    for (let i = 0; i < MarkupPackManager.packs.length; i++) {
      if (!MarkupPackManager.packs[i].enabled) continue
      for (let key of Object.keys(MarkupPackManager.packs[i].supports)) {
        for (let j = 0; j < MarkupPackManager.packs[i].supports[key].length; j++) {
          if (ext.toLowerCase() == MarkupPackManager.packs[i].supports[key][j]) {
            return key
          }
        }
      }
    }
    return ''
  },
  getSupportedExtensions: () => {
    let extensions = {}
    for (let i = 0; i < MarkupPackManager.packs.length; i++) {
      if (!MarkupPackManager.packs[i].enabled) continue
      for (let key of Object.keys(MarkupPackManager.packs[i].supports)) {
        // Check for existing extensions entry.
        let match = ''
        for (let [k,v] of Object.entries(extensions)) {
          if (key.toUpperCase() == k.toUpperCase()) {
            match = k
            break
          }
        }
        if (match == '') {
          match = key
          extensions[key] = []
        }
        // Add file extensions to their sections.
        for (let j = 0; j < MarkupPackManager.packs[i].supports[key].length; j++) {
          let extension = MarkupPackManager.packs[i].supports[key][j].toLowerCase();
          if (!extensions[match].includes(extension)) {
            extensions[match].push(extension);
          }
        }
      }
    }
    return extensions;
  },
  getMarkup: (type) => {
    if (MarkupPackManager.cached_packs[type]) {
      if (!MarkupPackManager.packs[MarkupPackManager.cached_packs[type]].enabled) return null
      return MarkupPackManager.packs[MarkupPackManager.cached_packs[type]];
    }
    for (let i = MarkupPackManager.packs.length-1; i >= 0; i--) {
      if (!MarkupPackManager.packs[i].enabled) continue
      for (let key of Object.keys(MarkupPackManager.packs[i].supports)) {
        for (let j = 0; j < MarkupPackManager.packs[i].supports[key].length; j++) {
          let regex = new RegExp(MarkupPackManager.packs[i].supports[key][j], 'i');
          if (regex.test(type)) {
            MarkupPackManager.cached_packs[type] = i;
            return MarkupPackManager.packs[i];
          }
        }
      }
    }
    return null
  },
  mod_replace_string: "$OME_MARKUP_PACKS"
});

module.exports = MarkupPackManager;
