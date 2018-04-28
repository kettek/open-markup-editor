let m = require('mithril');

let Files = require('../models/Files');

module.exports = {
  view: (vnode) => {
    return(m("section.welcome", m('span', "Hello! Create or Open a markup file of your delicious flavour!")));
  }
}
