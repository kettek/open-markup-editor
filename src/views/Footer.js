let m = require('mithril');

let Files = require('../models/Files');

module.exports = {
  view: (vnode) => {
    return m('footer', 'TYPE: ' + Files.getFileExtension(vnode.attrs.fileIndex));
  }
}
