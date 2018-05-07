let m = require('mithril');
const settings = require('electron-app-settings');

let Files   = require('../models/Files');

module.exports = {
  view: (vnode) => {
    return m('footer', [
      m('span', 'TYPE: ' + Files.getFileExtension(vnode.attrs.fileIndex)),
      m('span.checkbox', 
        m('input[type=checkbox]#synch_lines', {
          onchange: m.withAttr("checked", (checked) => {
            settings.set('render.synch_lines', checked);
          }),
          checked: settings.get('render.synch_lines')
        }), m('label[for=synch_lines]', "synch-to-line")
      )
    ]);
  }
}
