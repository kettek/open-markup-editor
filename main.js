let m = require('mithril');

const settings = require('electron').remote.require('electron-settings');

const Files = require('./src/models/Files');

const { ipcRenderer } = require('electron');

// ---- Setup IPC ---
ipcRenderer.on('file-new', (event, arg) => {
  Files.newFile();
});
ipcRenderer.on('file-open', (event, arg) => {
  Files.loadFile(arg);
});
ipcRenderer.on('file-save', (event, arg) => {
  Files.saveFile(arg, false);
});
ipcRenderer.on('file-save-as', (event, arg) => {
  Files.saveFile(-1, true);
});

ipcRenderer.on('file-close', (event, arg) => {
});

let MainView = require('./src/views/Main');

m.route(document.body, "/", {
  "/": MainView
})

