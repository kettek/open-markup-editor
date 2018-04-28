const { ipcRenderer, remote } = require('electron');
const Files       = require('./src/models/Files');
const RenderPacks = remote.require('./src/models/RenderPacks');

const url = require('url');
const path = require('path');

let rp = RenderPacks.getPack(Files.getFileExtension(Files.focused));

window.ome = {};
window.ome.on = (name, cb) => {
  window.ome.on[name] = window.ome.on[name] || [];
  window.ome.on[name].push(cb);
};
window.ome.emit = (name, data) => {
  for (let cb of window.ome.on[name]) {
    cb(data);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('webview-disable-external-navigation', true);
  window.onbeforeunload = () => {
    ipcRenderer.send('webview-disable-external-navigation', false);
  }

  let filepath = '', filename = '';

  ipcRenderer.on('filepath', (event, message) => {
    filepath = message;
    window.ome.emit('filepath', filepath);
  });
  ipcRenderer.on('filename', (event, message) => {
    filename = message;
    window.ome.emit('filename', message);
  });

  ipcRenderer.on('render', (event, message) => {
    window.ome.emit('render', message);
  });
  ipcRenderer.on('line', (event, message) => {
    window.ome.emit('line', message);
  });
  window.dispatchEvent(new Event('ome-ready'));
  window.ome.emit('ready');
});

if (rp.preload) {
  require(rp.preload);
}
