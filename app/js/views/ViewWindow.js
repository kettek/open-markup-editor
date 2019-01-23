let m = require('mithril');
const settings = require('electron-app-settings');

const AppState = require('../models/AppState');
let Files = require('../models/Files');

let EditorView  = require('./Editor')
  , PreviewView = require('./Preview')
  , Splitter     = require('./Splitter')

module.exports = {
  oncreate: (vnode) => {
    AppState.on('settings-open-timer', vnode.state.onSettingsOpening = (completed) => {
      vnode.dom.style.left = (-completed) + '%'
    });
    AppState.on('settings-close-timer', vnode.state.onSettingsClosing = (completed) => {
      vnode.dom.style.left = (-100 + completed) + '%'
    });
  },
  onremove: (vnode) => {
    AppState.off('settings-open-timer', vnode.state.onSettingsOpening);
    AppState.off('settings-close-timer', vnode.state.onSettingsClosing);
  },
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
