let m = require('mithril');
const settings = require('electron-app-settings');

let Files = require('../models/Files');
let MarkupPacks = require('../models/MarkupPacks');
let RenderPacks = require('../models/RenderPacks');

module.exports = {
  oncreate: (vnode) => {
      vnode.dom.addEventListener('dom-ready', () => {
        vnode.dom.send('go', RenderPacks.getPack(Files.getFileExtension(Files.focused)));
        let converted_text = MarkupPacks.parseText(Files.getFileExtension(Files.focused), Files.getFileText(Files.focused));
        vnode.dom.send('filename', Files.getFileName(Files.focused));
        vnode.dom.send('filepath', Files.getFilePath(Files.focused));
        vnode.dom.send('render', converted_text);
        if (settings.get('render.synch_lines') == true) vnode.dom.send('line', Files.getFileLine(Files.focused));
      });
  },
  onupdate: (vnode) => {
    if (Files.isFileDirty(Files.focused, true) || Files.should_redraw) {
      let converted_text = MarkupPacks.parseText(Files.getFileExtension(Files.focused), Files.getFileText(Files.focused));
      // TODO: only send filename/filepath when the focused file changes!
      vnode.dom.send('filename', Files.getFileName(Files.focused));
      vnode.dom.send('filepath', Files.getFilePath(Files.focused));
      vnode.dom.send('render', converted_text);
      Files.setFileDirty(Files.focused, false);
      Files.should_redraw = false;
    }
    if (settings.get('render.synch_lines') == true) vnode.dom.send('line', Files.getFileLine(Files.focused));
  },
  view: (vnode) => {
    let rp = RenderPacks.getPack(Files.getFileExtension(Files.focused));
    return m('webview',
             { 
               autosize: true,
               minwidth: 0,
               minheight: 0,
               src: rp.preview,
               preload: './preload.js'
             }
    );
  }
}
