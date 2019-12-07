let m = require('mithril');

const Files = require('../models/Files');
const AppState = require('../models/AppState');

const Icon = require('./Icon');

module.exports = {
  view: (vnode) => {
    return m('nav.tabs-bar', [
      m('.tabs-bar__controls', [
        m(Icon, {
          attrs: { onclick: () => Files.newFile() },
          iconName: 'file-new',
          className: 'button new'
        }),
        m(Icon, {
          attrs: { onclick: Files.openFile },
          iconName: 'file-open',
          className: 'button open'
        }),
        m(Icon, {
          attrs: { onclick: ()=>{Files.saveFile()} },
          iconName: 'file-save',
          className: 'button save' + (Files.isFileSaved(Files.focused) ? ' disabled' : '')
        }),
        /*m('.tabs-bar__controls__item.save-as', 
          { onclick: Files.saveFileAs },
          m(Icon, {
            iconName: 'file-save-as',
            className: 'button save-as'
          })
        ),*/
      ]),
      m('.tabs', 
        vnode.children,
      ),
      m(Icon, {
        attrs: { onclick: () => AppState.show_config = !AppState.show_config },
        iconName: 'gear',
        className: 'button settings'
      })
    ]);
  }
}
