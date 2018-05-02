let m = require('mithril');

let Files = require('../models/Files');
let Config = require('../models/Config');

module.exports = {
  view: (vnode) => {
    return(m("section.settings", Object.entries(Config).map((entry) => {
      return m('label', m('input', { value: entry[1] }), entry[0]);
    })));
  }
}
