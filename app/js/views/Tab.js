let m = require('mithril');

let Files = require('../models/Files');

let Icon = require('./Icon')

module.exports = {
  view: (vnode) => {
    return m('.tab'+(Files.focused == vnode.attrs.fileIndex ? '.focused' : ''),
      { onclick: () => { Files.setFileFocus(vnode.attrs.fileIndex); } }
      ,
      [
        //m('span', Files.getFileName(vnode.attrs.fileIndex) + (!Files.isFileSaved(vnode.attrs.fileIndex) ? '*' : ''))
        m('span'+(!Files.isFileSaved(vnode.attrs.fileIndex) ? '.unsaved' : '')+(Files.isFileChanged(vnode.attrs.fileIndex) ? '.changed' : '')+(Files.isFileDeleted(vnode.attrs.fileIndex) ? '.deleted' : ''), Files.getFileName(vnode.attrs.fileIndex))
      , m(Icon, {
          iconName: "remove",
          className: "button close",
          attrs: {
            onclick: () => {
              Files.closeFile(vnode.attrs.fileIndex);
            }
          }
        }, '')
      /*, m('button.close', { onclick: () => {
          Files.closeFile(vnode.attrs.fileIndex);
        }}, '' )*/
      ]
    );
  }
}
