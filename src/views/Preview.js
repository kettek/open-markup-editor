let m = require('mithril');

let Files = require('../models/Files');
let MarkupPacks = require('electron').remote.require('./src/models/MarkupPacks');
let RenderPacks = require('electron').remote.require('./src/models/RenderPacks');

module.exports = {
  oncreate: (vnode) => {
      vnode.dom.addEventListener('dom-ready', () => {
        let converted_text = MarkupPacks.parseText(Files.getFileExtension(Files.focused), Files.getFileText(Files.focused));
        vnode.dom.send('render', converted_text);
        vnode.dom.send('line', Files.getFileLine(Files.focused));
      });
  },
  onupdate: (vnode) => {
    if (Files.isFileDirty(Files.focused, true) || Files.should_redraw) {
      let converted_text = MarkupPacks.parseText(Files.getFileExtension(Files.focused), Files.getFileText(Files.focused));
      vnode.dom.send('render', converted_text);
      Files.setFileDirty(Files.focused, false);
      Files.should_redraw = false;
    }
    vnode.dom.send('line', Files.getFileLine(Files.focused));
  },
  view: (vnode) => {
    let rp = RenderPacks.getPack(Files.getFileExtension(Files.focused));
    return m('webview',
             { 
               autosize: true,
               minwidth: 0,
               minheight: 0,
               nodeintegration: true,
               src: rp.preview,
               preload: rp.preload
             }
    );
  }
}
