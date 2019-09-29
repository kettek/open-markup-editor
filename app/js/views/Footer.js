let m = require('mithril');
const settings = require('electron-app-settings');
const RenderPackManager = require('../RenderPackManager');

let Files   = require('../models/Files');

module.exports = {
  view: (vnode) => {
    return m('footer', [
      m('span', 'TYPE: ' + Files.getFileExtension(vnode.attrs.fileIndex)),
      m('span',
        m('label[for=renderpack]', "Render Pack:"),
        m("select#renderpack", {onchange: (e) => {
          RenderPackManager.select(e.target.options[e.target.selectedIndex].value);
        }},
          RenderPackManager.packs.map((pack, index) => {
            return m('option', (index == RenderPackManager.selected_index ? {selected: true} : {}), pack.name);
          }),
        )
      )
    ]);
  }
}
