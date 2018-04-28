let m = require('mithril');

let Files = require('../models/Files');

module.exports = {
  view: (vnode) => {
    return m('.tab'+(Files.focused == vnode.attrs.fileIndex ? '.focused' : ''),
      { onclick: () => { Files.setFileFocus(vnode.attrs.fileIndex); } }
      ,
      [
        m('span', Files.getFileName(vnode.attrs.fileIndex) + (!Files.isFileSaved(vnode.attrs.fileIndex) ? '*' : ''))
      , m('button.close', { onclick: () => {
          Files.closeFile(vnode.attrs.fileIndex);
        }}, '' )
      ]
    );
  }
}
