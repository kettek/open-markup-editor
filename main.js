let m = require('mithril');

const settings = require('electron-app-settings');

const log = require('electron-log');

const Files = require('./src/models/Files');
const UIState = require('./src/UIState');

const EditorModuleMangaer = require('./src/EditorPackManager');
const MarkupPackManager = require('./src/MarkupPackManager');
const RenderPackManager = require('./src/RenderPackManager');

const ExtensionPackManager = require('./src/ExtensionPackManager');

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
ipcRenderer.on('conf-show', (event, arg) => {
  UIState.show_config = true;
  m.redraw();
});

ipcRenderer.on('init', (event, arg) => {
  // TODO: some "init" event
  ExtensionPackManager.populate(path.join(__dirname, 'extensions'), () => {
    for (let i = 0; i < ExtensionPackManager.packs.length; i++) {
      ExtensionPackManager.setup(i);
      if (!ExtensionPackManager.packs[i].get('disabled')) {
        ExtensionPackManager.enable(i);
      }
    }
  });
  EditorModuleMangaer.populate(path.join(__dirname, 'editor-packs'), () => {
    for (let i = 0; i < EditorModuleMangaer.packs.length; i++) {
      if (!EditorModuleMangaer.packs[i].get('disabled')) {
        EditorModuleMangaer.enable(i);
      }
    }
  });
  MarkupPackManager.populate(path.join(__dirname, 'markup-packs'), () => {
    for (let i = 0; i < MarkupPackManager.packs.length; i++) {
      if (!MarkupPackManager.packs[i].get('disabled')) {
        MarkupPackManager.enable(i);
      }
    }
  });
  RenderPackManager.populate(path.join(__dirname, 'render-packs'), () => {
  });
  ipcRenderer.send('ready-to-run');
});

let MainView = require('./src/views/Main');

m.route(document.body, "/", {
  "/": MainView
})

