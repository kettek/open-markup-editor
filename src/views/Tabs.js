let m = require('mithril');

const Files = require('../models/Files');
const UI = require('../UIState');

module.exports = {
  view: (vnode) => {
    return m('nav.tabs', [
      vnode.children,
      m('.tab', {onclick: Files.newFile}, m('button.new')),
      m('.tab.settings', {onclick: () => UI.show_config = !UI.show_config}, m('button.settings'))
    ]);
  }
}
