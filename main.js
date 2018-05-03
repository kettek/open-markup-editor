let m = require('mithril');

const settings = require('electron').remote.require('electron-settings');

const Files = require('./src/models/Files');

const Config = require('./src/models/Config');

const EditorPacks = require('./src/models/EditorPacks');

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
ipcRenderer.on('set-config', (event, arg) => {
  Config.setConfig(arg);

  // TODO: some "init" event
  Extensions.populateExtensionsList(path.join(__dirname, 'extensions'), () => {
    for (let i = 0; i < Extensions.list.length; i++) {
      Extensions.setupExtension(i);
      Extensions.enableExtension(i);
    }
  });

  EditorPacks.loadPack(Config.editorpack);
});
ipcRenderer.on('update-config', (event, arg) => {
  Config.storeConfig(arg.key, arg.value);
});

let MainView = require('./src/views/Main');

m.route(document.body, "/", {
  "/": MainView
})

