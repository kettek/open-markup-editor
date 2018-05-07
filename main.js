let m = require('mithril');

const settings = require('electron-app-settings');

const log = require('electron-log');

const Files = require('./src/models/Files');

const EditorPacks = require('./src/models/EditorPacks');
const MarkupPacks = require('./src/models/MarkupPacks');
const RenderPacks = require('./src/models/RenderPacks');

const Extensions = require('./src/Extensions');

const { ipcRenderer } = require('electron');

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

ipcRenderer.on('init', (event, arg) => {
  // TODO: some "init" event
  Extensions.populateExtensionsList(path.join(__dirname, 'extensions'), () => {
    for (let i = 0; i < Extensions.list.length; i++) {
      Extensions.setupExtension(i);
      if (Extensions.list[i].getConf('enabled')) {
        Extensions.enableExtension(i);
      }
    }
  });
  EditorPacks.loadPacksFromDir(path.join(__dirname, 'editor-packs'));
  MarkupPacks.loadPacksFromDir(path.join(__dirname, 'markup-packs'));
  RenderPacks.loadPacksFromDir(path.join(__dirname, 'render-packs'));
  ipcRenderer.send('ready-to-run');
});

let MainView = require('./src/views/Main');

m.route(document.body, "/", {
  "/": MainView
})

