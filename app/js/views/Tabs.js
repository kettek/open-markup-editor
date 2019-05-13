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
          className: 'button new'
        })
      ),
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
