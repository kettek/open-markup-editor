let m = require('mithril');
const settings = require('electron-app-settings');

let Files = require('../models/Files');

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
        m('section.preview', (settings.get('element_settings.SECTION\\.preview') ? settings.get('element_settings.SECTION\\.preview') : {}), [m(PreviewView, {fileIndex: vnode.attrs.fileIndex})]),
        vnode.attrs.children
    ]);
  }
}
