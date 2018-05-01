let m = require('mithril');

const Files = require('../models/Files');

module.exports = {
  view: (vnode) => {
    return m('nav.tabs', [
      vnode.children,
      m('.tab', {onclick: Files.newFile}, m('button.new'))
    ]);
  }
}
