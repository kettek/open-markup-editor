let m = require('mithril');

const Files = require('../models/Files');
const AppState = require('../models/AppState');

module.exports = {
  view: (vnode) => {
    return m('nav.tabs', [
      vnode.children,
      m('.tab', {onclick: Files.newFile}, m('button.new')),
      m('.tab.settings', {onclick: () => AppState.show_config = !AppState.show_config}, m('button.settings'))
    ]);
  }
}
