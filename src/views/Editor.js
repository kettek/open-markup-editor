let m = require('mithril');
let CodeMirror = require('./CodeMirror');

module.exports = {
  view: (vnode, attrs) => {
    return m('section.editor', [
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
