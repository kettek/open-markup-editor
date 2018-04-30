const { ipcRenderer, remote } = require('electron');
const Files       = require('./src/models/Files');
const RenderPacks = remote.require('./src/models/RenderPacks');
const Emitter = require('./src/emitter.js');

const url = require('url');
const path = require('path');

let rp = RenderPacks.getPack(Files.getFileExtension(Files.focused));

window.ome = Emitter();

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
    // Store and restore scroll positions
    let x = window.scrollX, y = window.scrollY;
    window.ome.emit('render', message);
    window.scroll(x,y);
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
