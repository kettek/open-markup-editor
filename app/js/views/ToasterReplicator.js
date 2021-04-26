const m        = require('mithril');
const Notifier = require('../models/Notifier');
const AppState = require('../models/AppState');
const { ipcRenderer } = require('electron');

module.exports = {
  oncreate: (vnode) => {
    vnode.state.is_toaster_ready = false;
    vnode.state.collectedToast = []
    ipcRenderer.on('toaster-ready', vnode.state.ready_handler = () => {
      let bounds = vnode.dom.getBoundingClientRect();
      ipcRenderer.send('toaster-bounds', {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      });

      vnode.state.is_toaster_ready = true;
      for (let toast of vnode.state.collectedToast) {
        ipcRenderer.send('toaster-toast', toast);
      }

      vnode.state.collectedToast = [];
    });
    ipcRenderer.send('toaster-open');
    //
    vnode.state.resize_handler = () => {
      let bounds = vnode.dom.getBoundingClientRect();
      ipcRenderer.send('toaster-bounds', {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      });
    }
    AppState.on('window-resize', vnode.state.resize_handler);
    Notifier.on('notification', vnode.state.notify_handler = msg => {
      let toast = {timestamp: new Date(), ...msg};
      if (vnode.state.is_toaster_ready) {
        ipcRenderer.send('toaster-toast', toast);
      } else {
        vnode.state.collectedToast.push(toast);
      }
    });
  },
  onremove: (vnode) => {
    ipcRenderer.send('toaster-close');
    ipcRenderer.off('toaster-ready', vnode.state.ready_handler);
    AppState.off('window-resize', vnode.state.resize_handler);
    Notifier.off('notification', vnode.state.notify_handler);
  },
  view: (vnode) => {
    return m(
      'section.toaster'
    )
  },
}