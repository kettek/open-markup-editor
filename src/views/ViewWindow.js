let m = require('mithril');

let Files = require('../models/Files');

let Config = require('../models/Config');

let EditorView  = require('./Editor')
  , PreviewView = require('./Preview')
  , Splitter     = require('./Splitter')

module.exports = {
  oninit: (vnode) => {
    vnode.state.fileIndex = vnode.attrs.fileIndex;
  },
  view: (vnode) => {
    return m('section.view-window', [
        m(EditorView, {fileIndex: vnode.attrs.fileIndex }),
        m(Splitter),
        m('section.preview', (Config.element_settings["SECTION.preview"] ? Config.element_settings["SECTION.preview"] : {}), [m(PreviewView, {fileIndex: vnode.attrs.fileIndex})]),
        vnode.attrs.children
    ]);
  }
}
