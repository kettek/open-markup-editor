const fs        = require('fs');
const path      = require('path');
const log       = require('electron-log');
const settings  = require('electron-app-settings');
const m         = require('mithril');

let RenderPacks = {
  packs: [
  ],
  selected_index: 0,
  selectPack: (index) => {
    if (typeof index == 'string') {
      index = RenderPacks.packs.map(e => {return e.name}).indexOf(index);
    }
    if (index < 0 || index >= RenderPacks.packs.length) return;
    RenderPacks.selected_index = index;
    settings.set('renderpack', RenderPacks.packs[index].name);
  },
  getPack: (filetype) => {
    if (RenderPacks.selected_index >= 0 && RenderPacks.selected_index < RenderPacks.packs.length) {
      for (let j = 0; j < RenderPacks.packs[RenderPacks.selected_index].targets.length; j++) {
        let regex = new RegExp(RenderPacks.packs[RenderPacks.selected_index].targets[j], 'i');
        if (regex.test(filetype)) {
          return RenderPacks.packs[RenderPacks.selected_index];
        }
      }
    }
    for (let i = RenderPacks.packs.length-1; i >= 0; i--) {
      for (let j = 0; j < RenderPacks.packs[i].targets.length; j++) {
        let regex = new RegExp(RenderPacks.packs[i].targets[j], 'i');
        if (regex.test(filetype)) {
          return RenderPacks.packs[i];
        }
      }
    }
  },
  loadPacksFromDir: (dir, on_finish=()=>{}) => {
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
          RenderPacks.loadPack(path.join(dir, file));
          log.info("  ...OK");
        } catch (e) {
          log.warn("  ...NOKAY");
          log.warn(e);
        }
      });
      on_finish();
    });
  },
  loadPack: (source) => {
    let check = (/^\$OME_RENDER_PACKS(.*)/g).exec(source);
    if (check) {
      source = '../../render-packs/' + check[1];
    }
    try {
      let pack = require(source);
      RenderPacks.packs.push(pack);
      if (pack.name === settings.get('renderpack')) {
        RenderPacks.selected_index = RenderPacks.packs.length-1;
      }
      m.redraw();
    } catch (e) {
      throw e;
    }
  }
}

module.exports = RenderPacks;
