let m = require('mithril');
const settings = require('electron-app-settings');
const RenderPackManager = require('../RenderPackManager');

let Files   = require('../models/Files');

module.exports = {
  view: (vnode) => {
    return m('footer', [
      m('span', 'TYPE: ' + Files.getFileExtension(vnode.attrs.fileIndex)),
      m('span.checkbox', 
        m('input[type=checkbox]#linewrapping', {
          onchange: m.withAttr("checked", (checked) => {
            settings.set('editor.linewrapping', checked);
          }),
          checked: settings.get('editor.linewrapping')
        }), m('label[for=linewrapping]', "wrap lines")
      ),

      m('span.checkbox', 
        m('input[type=checkbox]#synch_lines', {
          onchange: m.withAttr("checked", (checked) => {
            settings.set('render.synch_lines', checked);
          }),
          checked: settings.get('render.synch_lines')
        }), m('label[for=synch_lines]', "synch-to-line")
      ),
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