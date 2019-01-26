const { 
  app, 
  BrowserWindow, 
  BrowserView, 
  Menu, 
  dialog, 
  ipcMain 
} = require('electron');
const isDev     = require('electron-is-dev');
const log       = require('electron-log');
                log.transports.console.level = 'info';
                log.transports.file.level = 'info';
let   settings  = {};
const path      = require('path');
const url       = require('url');
const menu      = require('./menu');
const windows   = require('./windows');

const util      = require('util');
const fs        = require('fs');
const asyncReadFile = util.promisify(fs.readFile)

console.log(process.versions.electron)

function createMainWindow() {
  windows.list[windows.MAIN_WINDOW] = new BrowserWindow({ width: settings.get("window.width"), height: settings.get("window.height"), show: true });
  windows.list[windows.MAIN_WINDOW].setBounds({x: settings.get("window.left"), y: settings.get("window.top"), width: settings.get("window.width"), height: settings.get("window.height")});

  windows.list[windows.MAIN_WINDOW].loadURL(url.format({
    pathname: path.join(__dirname, 'app.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Send our settings to the renderer when it loads.
  windows.list[windows.MAIN_WINDOW].webContents.on('did-finish-load', () => {
    windows.list[windows.MAIN_WINDOW].webContents.send('init', process.argv[0]);
    // Send file open for any passed arguments
    process.argv.forEach((val, index) => {
      if (index == 0) return; // FIXME: index >= 1 when npm start called directly
      windows.list[windows.MAIN_WINDOW].webContents.send('file-open', val);
    });

  });

  windows.list[windows.MAIN_WINDOW].on('close', () => {
    let bounds = windows.list[windows.MAIN_WINDOW].getBounds();
    settings.set("window", {left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height });
    windows.list[windows.MAIN_WINDOW] = null;
  });
}

function createPreviewView() {
  // Create our hidden browserview
  windows.list[windows.PREVIEW] = new BrowserView({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      preload: require.resolve('./js/preload.js'),
      devTools: true
    }
  });
  windows.list[windows.MAIN_WINDOW].setBrowserView(windows.list[windows.PREVIEW]);
  windows.list[windows.PREVIEW].setBounds({x: -100, y: -100, width: 100, height: 100 });
  windows.list[windows.PREVIEW].webContents.on('will-navigate', (event, url) => {
    console.log("Denying navigation to " + url)
    event.preventDefault();
  });
  // Set up Main to Renderer IPC transactions.
  windows.list[windows.PREVIEW].webContents.on('did-finish-load', () => {
    windows.list[windows.PREVIEW].webContents.send('go', windows.list[windows.PREVIEW].renderPack);
    windows.list[windows.MAIN_WINDOW].webContents.send('preview-loaded');
  });
}
function destroyPreviewView() {
  windows.list[windows.MAIN_WINDOW].setBrowserView(null);
  windows.list[windows.PREVIEW].destroy();
  windows.list[windows.PREVIEW] = null;
}

(function setupPreviewIPC() {
  // See did-finish-load for other section.
  ipcMain.on('preview-load', (event, render_pack) => {
    createPreviewView();
    windows.list[windows.PREVIEW].webContents.loadURL(url.format({
      pathname: path.resolve(render_pack.preview),
      protocol: 'file:',
      slashes: true
    }));
    windows.list[windows.PREVIEW].renderPack = render_pack;
  });
  ipcMain.on('preview-update', (event, options) => {
    if (options.filepath !== undefined) {
      windows.list[windows.PREVIEW].webContents.send('filepath', options.filepath);
    }
    if (options.filename !== undefined) {
      windows.list[windows.PREVIEW].webContents.send('filename', options.filename);
    }
    if (options.render !== undefined) {
      windows.list[windows.PREVIEW].webContents.send('render', options.render);
    }
    if (options.line !== undefined) {
      windows.list[windows.PREVIEW].webContents.send('line', options.line);
    }
    if (options.bounds !== undefined) {
      let bounds = {
        x: Math.round(options.bounds.x),
        y: Math.round(options.bounds.y),
        width: Math.round(options.bounds.width),
        height: Math.round(options.bounds.height)
      }
      windows.list[windows.PREVIEW].setBounds(bounds);
    }
  });
  ipcMain.on('preview-unload', (event) => {
    destroyPreviewView();
  });
})()

let is_main_instance = app.requestSingleInstanceLock();
app.on('second-instance', ((event, argv, cwd) => {
  if (windows.list[windows.MAIN_WINDOW]) {
    if (windows.list[windows.MAIN_WINDOW].isMinimized()) windows.list[windows.MAIN_WINDOW].restore();
    windows.list[windows.MAIN_WINDOW].focus();
    // Send file open for any passed arguments
    argv.forEach((val, index) => {
      if (index == 0) return; // FIXME: index >= 1 when npm start called directly
      windows.list[windows.MAIN_WINDOW].webContents.send('file-open', val);
    });
  }
}));

if (is_main_instance) {
  // TODO: handle open-file for Mac OS
  settings = require('electron-app-settings');
  app.on('ready', () => {
    // ---- Defaults ----
    settings.set({
      window: {
        width: 800,
        height: 600,
        left: 0,
        top: 0
      },
      editor: {
        update_delay: 250
      },
      render: {
        synch_lines: true
      },
      recent_files: [],
      renderpack: "$OME_RENDER_PACKS/ome-rp-default",
      editorpack: "$OME_EDITOR_PACKS/ome-ep-codemirror"
    }, true);
    // ---- ----
    menu.init();
  
    createMainWindow();
  });
  
  app.on('window-all-closed', () => {
    //if (process.platform !== 'darwin') {
      app.quit();
    //}
  });
  
  app.on('activate', () => {
    if (windows.list[windows.MAIN_WINDOW] === null) {
      createMainWindow();
    }
  });
  // ----
  const disableNavigation = (event, url) => {
    event.preventDefault();
  }
  ipcMain.on('webview-disable-external-navigation', (event, enabled) => {
    if (enabled) {
      event.sender.on('will-navigate', disableNavigation);
    } else {
      event.sender.removeListener('will-navigate', disableNavigation);
    }
  });
  ipcMain.on('ready-to-run', (event) => {
    windows.list[windows.MAIN_WINDOW].show();
    if (isDev) windows.list[windows.MAIN_WINDOW].toggleDevTools();
  });
} else {
  app.quit();
}