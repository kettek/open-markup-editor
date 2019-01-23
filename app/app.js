let m = require('mithril');

const settings = require('electron-app-settings');

const log = require('electron-log');

const DataManager = require('./js/DataManager');

const Files = require('./js/models/Files');
const AppState = require('./js/models/AppState');

const EditorModuleManager = require('./js/EditorPackManager');
const MarkupPackManager = require('./js/MarkupPackManager');
const RenderPackManager = require('./js/RenderPackManager');

const ExtensionPackManager = require('./js/ExtensionPackManager');

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
ipcRenderer.on('file-import', (event, arg) => {
  Files.importFile(arg);
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
  AppState.show_config = true;
  m.redraw();
});

ipcRenderer.on('init', (event, arg) => {
  // Add "project root/packs" for built-in packs.
  DataManager.addPath({
    path: path.join(__dirname, '..', 'packs'),
    writable: false
  });
  // Add Application's CWD/packs (same as above if using `npm start`)
  DataManager.addPath({
    path: path.join(path.dirname(arg), 'packs'),
    writable: false
  });
  // Add User's data directory
  DataManager.addPath({
    path: app.getPath('userData'),
    writable: true
  }, 0);
  // TODO: some "init" event
  ExtensionPackManager.populate('extension-packs', () => {
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

// Drag and Drop support
document.body.addEventListener('dragover', (ev) => {
  ev.stopPropagation();
  ev.preventDefault();
  ev.dataTransfer.dropEffect = 'copy';
});
document.body.addEventListener('drop', (ev) => {
  ev.stopPropagation();
  ev.preventDefault();
  for (let f of ev.dataTransfer.files) {
    Files.loadFile(f.path);
  }
  return false;
});

// Courtesy of MDN
(function() {
  var throttle = function(type, name, obj) {
    obj = obj || window;
    var running = false;
    var func = function() {
      if (running) { return; }
      running = true;
      requestAnimationFrame(function() {
        obj.dispatchEvent(new CustomEvent(name));
        running = false;
      });
    };
    obj.addEventListener(type, func);
  };

  /* init - you can init any event */
  throttle("resize", "optimizedResize");
})();

// handle event
window.addEventListener("optimizedResize", function() {
  AppState.emit('window-resize', window.innerWidth, window.innerHeight);
});

let MainView = require('./js/views/Main');

m.route(document.body, "/", {
  "/": MainView
})

