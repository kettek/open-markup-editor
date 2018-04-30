let m = require('mithril');

let Files   = require('../models/Files');
let Config  = require('../models/Config');

module.exports = {
  view: (vnode) => {
    return m('footer', [
      m('span', 'TYPE: ' + Files.getFileExtension(vnode.attrs.fileIndex)),
      m('span.checkbox', 
        m('input[type=checkbox]#synch_lines', {
          onchange: m.withAttr("checked", (checked) => {
            Config.synch_lines = checked;
          }),
          checked: Config.synch_lines
        }), m('label[for=synch_lines]', "synch-to-line")
      )
    ]);
  }
}
