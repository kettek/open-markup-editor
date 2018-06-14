let m = require('mithril');

const settings = require('electron-app-settings');

const log = require('electron-log');

const DataManager = require('./src/DataManager');

const Files = require('./src/models/Files');
const UIState = require('./src/UIState');

const EditorModuleManager = require('./src/EditorPackManager');
const MarkupPackManager = require('./src/MarkupPackManager');
const RenderPackManager = require('./src/RenderPackManager');

const ExtensionPackManager = require('./src/ExtensionPackManager');

const { ipcRenderer } = require('electron');
const { app } = require('electron').remote;

const path = require('path');

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
  if (Files.closeFile(-1) == false) {
    // Quit if there are no more files?
  }
});
ipcRenderer.on('conf-show', (event, arg) => {
  UIState.show_config = true;
  m.redraw();
});

ipcRenderer.on('init', (event, arg) => {
  // Add directory relative to main.js
  DataManager.addPath({
    path: __dirname,
    writable: false
  });
  // Add Application's CWD (same as above if using `npm start`)
  DataManager.addPath({
    path: path.dirname(arg),
    writable: false
  });
  // Add User's data directory
  DataManager.addPath({
    path: app.getPath('userData'),
    writable: true
  }, 0);
  // TODO: some "init" event
  ExtensionPackManager.populate('extensions', () => {
    for (let i = 0; i < ExtensionPackManager.packs.length; i++) {
      ExtensionPackManager.setup(i);
      if (!ExtensionPackManager.packs[i].get('disabled')) {
        ExtensionPackManager.enable(i);
      }
    }
  });
  EditorModuleManager.populate('editor-packs', () => {
    for (let i = 0; i < EditorModuleManager.packs.length; i++) {
      if (!EditorModuleManager.packs[i].get('disabled')) {
        EditorModuleManager.enable(i);
      }
    }
  });
  MarkupPackManager.populate('markup-packs', () => {
    for (let i = 0; i < MarkupPackManager.packs.length; i++) {
      if (!MarkupPackManager.packs[i].get('disabled')) {
        MarkupPackManager.enable(i);
      }
    }
  });
  RenderPackManager.populate('render-packs', () => {
  });
  ipcRenderer.send('ready-to-run');
});

let MainView = require('./src/views/Main');

m.route(document.body, "/", {
  "/": MainView
})

