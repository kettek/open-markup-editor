let m = require('mithril');
let Config = require('../models/Config');
let CodeMirror = require('./CodeMirror');

module.exports = {
  view: (vnode, attrs) => {
    return m('section.editor', (Config.element_settings["SECTION.editor"] ? Config.element_settings["SECTION.editor"] : {}), [
      m(".CodeMirrorWrapper", m(CodeMirror, {
        parentState: vnode.state,
        value: vnode.value,
        fileIndex: vnode.attrs.fileIndex
      }))
    ])
  },
  oncreate: (vnode) => {
  }
}
