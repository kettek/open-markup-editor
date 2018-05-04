const fs      = require('fs');
const path    = require('path');

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
      files.forEach(file => {
        try {
          RenderPacks.loadPack(path.join(dir, file));
        } catch (e) {
          console.log("Failed to load Render Pack \"" + file + "\"");
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
      console.log(e);
    }
  }
}

module.exports = RenderPacks;
