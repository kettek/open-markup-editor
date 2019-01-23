const MM = require('./PackManager');
const settings  = require('electron-app-settings');

const RenderPackManager = MM('render-packs', {
  selected_index: 0,
  mod_replace_string: "$OME_RENDER_PACKS",
  select: (index) => {
    if (typeof index == 'string') {
      index = RenderPackManager.packs.map(e => {return e.name}).indexOf(index);
    }
    if (index < 0 || index >= RenderPackManager.packs.length) return;
    RenderPackManager.selected_index = index;
    settings.set('renderpack', RenderPackManager.packs[index].name);
  },
  get: (filetype) => {
    if (RenderPackManager.selected_index >= 0 && RenderPackManager.selected_index < RenderPackManager.packs.length) {
      for (let j = 0; j < RenderPackManager.packs[RenderPackManager.selected_index].targets.length; j++) {
        let regex = new RegExp(RenderPackManager.packs[RenderPackManager.selected_index].targets[j], 'i');
        if (regex.test(filetype)) {
          return RenderPackManager.packs[RenderPackManager.selected_index];
        }
      }
    }
    for (let i = RenderPackManager.packs.length-1; i >= 0; i--) {
      for (let j = 0; j < RenderPackManager.packs[i].targets.length; j++) {
        let regex = new RegExp(RenderPackManager.packs[i].targets[j], 'i');
        if (regex.test(filetype)) {
          return RenderPackManager.packs[i];
        }
      }
    }
  }
});

RenderPackManager.on('load', (ext) => {
  if (ext.name === settings.get('renderpack')) {
    RenderPackManager.selected_index = RenderPackManager.packs.length-1;
  }
});


module.exports = RenderPackManager;
