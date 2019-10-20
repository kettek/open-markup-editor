let m = require('mithril');

const Files = require('../models/Files');
const AppState = require('../models/AppState');

const Icon = require('./Icon');

module.exports = {
  view: (vnode) => {
    return m('nav.tabs', [
      m('.tab.new', 
        { onclick: Files.newFile },
        m(Icon, {
          iconName: 'file-new',
          className: 'button new'
        })
      ),
      m('.tab.open', 
        { onclick: Files.openFile },
        m(Icon, {
          iconName: 'file-open',
          className: 'button open'
        })
      ),
      m('.tab.save' + (Files.isFileSaved(Files.focused) ? '.disabled' : ''), 
        { onclick: ()=>{Files.saveFile()} },
        m(Icon, {
          iconName: 'file-save',
          className: 'button save'
        })
      ),
      /*m('.tab.save-as', 
        { onclick: Files.saveFileAs },
        m(Icon, {
          iconName: 'file-save-as',
          className: 'button save-as'
        })
      ),*/
      vnode.children,
      m('.tab.settings',
        { onclick: () => AppState.show_config = !AppState.show_config },
        m(Icon, {
          iconName: 'gear',
          className: 'button settings'
        })
      )
    ]);
  }
}
