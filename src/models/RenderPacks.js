const fs      = require('fs');
const path    = require('path');
const log     = require('electron-log');

let RenderPacks = {
  packs: [
  ],
  getPack: (filetype) => {
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
      log.info("Found " + files.length + " RenderPack" + (files.length == 1 ? '' : 's') +" in " + dir);
      files.forEach(file => {
        log.info(" Loading " + file + "...");
        try {
          RenderPacks.loadPack(path.join(dir, file));
        } catch (e) {
          log.warn("  Failed to load RenderPack \"" + file + "\"");
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
      RenderPacks.packs.push(require(source));
    } catch (e) {
      throw e;
    }
  }
}

module.exports = RenderPacks;
