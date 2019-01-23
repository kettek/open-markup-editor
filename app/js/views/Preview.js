let m = require('mithril');
const settings = require('electron-app-settings');
const path = require('path');
const { ipcRenderer } = require('electron');

let Files = require('../models/Files');
let MarkupPackManager = require('../MarkupPackManager');
let RenderPackManager = require('../RenderPackManager');
const AppState = require('../models/AppState');

const main_window = require('electron').remote.getCurrentWindow();

module.exports = {
  oncreate: (vnode) => {
    vnode.state.renderPack = settings.get('renderpack')
    let rp = RenderPackManager.get(Files.getFileExtension(Files.focused));
    ipcRenderer.send('preview-load', RenderPackManager.get(Files.getFileExtension(Files.focused)));
    ipcRenderer.on('preview-loaded', () => {
      let bounds = vnode.dom.getBoundingClientRect();
      let converted_text = MarkupPackManager.parseText(Files.getFileExtension(Files.focused), Files.getFileText(Files.focused));
      ipcRenderer.send('preview-update', {
        filename: Files.getFileName(Files.focused),
        filepath: Files.getFilePath(Files.focused),
        render:   converted_text,
        bounds:   {
          x:      bounds.x,
          y:      bounds.y,
          width:  bounds.width,
          height: bounds.height
        }
      });
      if (settings.get('render.synch_lines') == true) {
        ipcRenderer.send('preview-update', {
          line: Files.getFileLine(Files.focused)
        });
      }
    });
    // Attach window resize listener
    vnode.state.resize_handler = () => {
      let bounds = vnode.dom.getBoundingClientRect();
      ipcRenderer.send('preview-update', {
        bounds:   {
          x:      bounds.x,
          y:      bounds.y,
          width:  bounds.width,
          height: bounds.height
        }
      });
    }
    AppState.on('window-resize', vnode.state.resize_handler);
    AppState.on('splitter-move', vnode.state.resize_handler);
    AppState.on('settings-close-timer', vnode.state.resize_handler);
    AppState.on('settings-open-timer', vnode.state.resize_handler);
  },
  onremove: (vnode) => {
    ipcRenderer.send('preview-unload');
    AppState.off('window-resize', vnode.state.resize_handler);
    AppState.off('splitter-move', vnode.state.resize_handler);
    AppState.off('preview-resize', vnode.state.resize_handler);
    AppState.off('settings-close-timer', vnode.state.resize_handler);
    AppState.off('settings-open-timer', vnode.state.resize_handler);
  },
  onupdate: (vnode) => {
    if (settings.get('renderpack') != vnode.state.renderPack) {
      vnode.state.renderPack = settings.get('renderpack');
      ipcRenderer.send('preview-load', RenderPackManager.get(Files.getFileExtension(Files.focused)));
    }
    if (Files.isFileDirty(Files.focused, true) || Files.should_redraw) {
      let converted_text = MarkupPackManager.parseText(Files.getFileExtension(Files.focused), Files.getFileText(Files.focused));
      // TODO: only send filename/filepath when the focused file changes!
      ipcRenderer.send('preview-update', {
        filename: Files.getFileName(Files.focused),
        filepath: Files.getFilePath(Files.focused),
        render:   converted_text
      });
      Files.setFileDirty(Files.focused, false);
      Files.should_redraw = false;
    }
    if (settings.get('render.synch_lines') == true) {
      ipcRenderer.send('preview-update', {
        line: Files.getFileLine(Files.focused)
      });
    }
  },
  view: (vnode) => {
    return m('browser-view');
  }
}
