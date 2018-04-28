let MarkupPacks = {
  cachedPacks: {},
  packs: [
    {
      supports: [".*"],
      render: (text) => {
        return text;
      }
    }
  ],
  parseText: (type, text) => {
    return MarkupPacks.getPack(type).render(text);
  },
  getPack: (type) => {
    if (MarkupPacks.cachedPacks[type]) return MarkupPacks.packs[MarkupPacks.cachedPacks[type]];
    for (let i = MarkupPacks.packs.length-1; i >= 0; i--) {
      for (let j = 0; j < MarkupPacks.packs[i].supports.length; j++) {
        let regex = new RegExp(MarkupPacks.packs[i].supports[j], 'i');
        if (regex.test(type)) {
          MarkupPacks.cachedPacks[type] = i;
          return MarkupPacks.packs[i];
        }
      }
    }
    return MarkupPacks.packs[0];
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
