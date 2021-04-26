const { ipcRenderer } = require('electron');
const m        = require('mithril');
let Toast      = require('./Toast')

let toasts = []
let currentToastIndex = 0
let topID = 0

module.exports = {
  oninit: vnode => {
    ipcRenderer.on('toast', vnode.state.toast_handler = (_,msg) => {
      toasts.push({...msg, key: topID++});
      ipcRenderer.send('toaster-show');
      m.redraw();
    });
    ipcRenderer.send('toaster-awaiting');
  },
  onremove: (vnode) => {
    ipcRenderer.off('toast', vnode.state.toast_handler);
  },
  view: (vnode) => {
    return m(
      'section.toaster',
      {},
      (toasts.length > 0 && currentToastIndex < toasts.length ?
        m(Toast, {
          ...toasts[currentToastIndex],
          ...{hasNext: currentToastIndex < toasts.length-1, hasPrev: currentToastIndex > 0, currentIndex: currentToastIndex, toastCount: toasts.length},
          onclose: () => {
            toasts = toasts.filter((_,i)=>i!==currentToastIndex);
            if (currentToastIndex >= toasts.length) {
              currentToastIndex--;
            }
            if (currentToastIndex < 0) {
              currentToastIndex = 0;
            }
            if (toasts.length === 0) {
              ipcRenderer.send('toaster-hide');
            }
            m.redraw()
          },
          onnav: (dir) => {
            if (currentToastIndex+dir >= 0 && currentToastIndex+dir < toasts.length) {
              currentToastIndex += dir;
            }
            m.redraw()
          },
        })
      : null)
    )
  },
}