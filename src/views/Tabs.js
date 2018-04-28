let m = require('mithril');

module.exports = {
  view: (vnode) => {
    return m('nav.tabs', vnode.children);
  }
}
