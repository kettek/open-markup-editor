const { 
  app, 
  BrowserWindow, 
  BrowserView, 
  Menu, 
  dialog, 
  ipcMain 
} = require('electron');

require('@electron/remote/main').initialize()

const isDev     = require('electron-is-dev');
const log       = require('electron-log');
                log.transports.console.level = 'info';
                log.transports.file.level = 'info';
                log.transports.ipc.level = 'info';
let   settings  = {};
const path      = require('path');
const url       = require('url');
const menu      = require('./menu');
const windows   = require('./windows');
const pkg       = require('../package.json');

const util      = require('util');
const fs        = require('fs');
const asyncReadFile = util.promisify(fs.readFile)

log.info('OME: ' + pkg.version)
log.info('Electron: ' + process.versions.electron)

function createSplashWindow() {
  windows.list[windows.SPLASH_WINDOW] = new BrowserWindow({ width: 320, height: 320, show: false, frame: false, transparent: true });
  windows.list[windows.SPLASH_WINDOW].webContents.on('did-finish-load', () => {
    windows.list[windows.SPLASH_WINDOW].show();
    createMainWindow();
  })
  windows.list[windows.SPLASH_WINDOW].loadURL(url.format({
    pathname: path.join(__dirname, 'splash.html'),
    protocol: 'file:',
    slashes: true
  }))
  windows.list[windows.SPLASH_WINDOW].on('close', () => {
    windows.list[windows.SPLASH_WINDOW] = null
  })
}

function createAboutWindow() {
  windows.list[windows.ABOUT_WINDOW] = new BrowserWindow({ width: 640, height: 480, parent: windows.list[windows.MAIN_WINDOW], modal: true, show: false, resizable: false, frame: false, webPreferences: { nodeIntegration: true, contextIsolation: false } });
  windows.list[windows.ABOUT_WINDOW].loadURL(url.format({
    pathname: path.join(__dirname, 'about.html'),
    protocol: 'file:',
    slashes: true
  }))
  ipcMain.on('about-hide', (event) => {
    windows.list[windows.ABOUT_WINDOW].hide();
    windows.list[windows.MAIN_WINDOW].focus();
  });
  function syncAboutSize() {
    let bounds = windows.list[windows.MAIN_WINDOW].getBounds()
    let abounds = {
      width: Math.round(bounds.width / 2),
      height: Math.round(bounds.height / 2),
      x: Math.round(bounds.x + bounds.width / 4),
      y: Math.round(bounds.y + bounds.height / 4),
    }
    windows.list[windows.ABOUT_WINDOW].setBounds(abounds)
  }
  windows.list[windows.MAIN_WINDOW].on('resize', (e) => {
    syncAboutSize()
  })
  windows.list[windows.MAIN_WINDOW].on('move', (e) => {
    syncAboutSize()
  })
  windows.list[windows.ABOUT_WINDOW].on('close', () => {
    windows.list[windows.ABOUT_WINDOW] = null
  })
}

function createMainWindow() {
  windows.list[windows.MAIN_WINDOW] = new BrowserWindow({ width: settings.get("window.width"), height: settings.get("window.height"), show: false, webPreferences: { nodeIntegration: true, contextIsolation: false, enableRemoteModule: true } });
  windows.list[windows.MAIN_WINDOW].setBounds({x: settings.get("window.left"), y: settings.get("window.top"), width: settings.get("window.width"), height: settings.get("window.height")});

  windows.list[windows.MAIN_WINDOW].loadURL(url.format({
    pathname: path.join(__dirname, 'app.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Send file-open events for all arguments not beginning with '--'
  windows.list[windows.MAIN_WINDOW].webContents.on('did-finish-load', () => {
    windows.list[windows.MAIN_WINDOW].webContents.send('init', process.argv[0]);
    // Send file open for any passed arguments
    process.argv.forEach((val, index) => {
      if (index == 0) return; // FIXME: index >= 1 when npm start called directly
      if (val.startsWith('--')) return;
      windows.list[windows.MAIN_WINDOW].webContents.send('file-open', val);
    });
  });

  windows.list[windows.MAIN_WINDOW].on('close', () => {
    let bounds = windows.list[windows.MAIN_WINDOW].getBounds();
    settings.set("window", {left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height });
    windows.list[windows.MAIN_WINDOW] = null;
    if (windows.list[windows.ABOUT_WINDOW]) windows.list[windows.ABOUT_WINDOW].close();
    if (windows.list[windows.SPLASH_WINDOW]) windows.list[windows.SPLASH_WINDOW].close();
    if (windows.list[windows.PREVIEW] && windows.list[windows.PREVIEW].close) windows.list[windows.PREVIEW].close();
    if (windows.list[windows.TOASTER] && windows.list[windows.TOASTER].close) windows.list[windows.TOASTER].close();
  });

  windows.list[windows.MAIN_WINDOW].on('resize', (e) => {
    let bounds = windows.list[windows.MAIN_WINDOW].getBounds();
    settings.set("window", {left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height });
  });

  // Might as well create our about window for future use here.
  createAboutWindow();
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
  windows.list[windows.MAIN_WINDOW].addBrowserView(windows.list[windows.PREVIEW]);
  if (windows.list[windows.MAIN_WINDOW].getBrowserViews().includes(windows.list[windows.TOASTER])) {
    windows.list[windows.MAIN_WINDOW].setTopBrowserView(windows.list[windows.TOASTER]);
  }
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
  windows.list[windows.MAIN_WINDOW].removeBrowserView(windows.list[windows.PREVIEW]);
  windows.list[windows.PREVIEW].webContents.destroy();
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
  ipcMain.on('preview-conf', (event, options) => {
    if (!windows.list[windows.PREVIEW]) return
    windows.list[windows.PREVIEW].webContents.send('conf', options);
  });
  ipcMain.on('preview-conf-set', (event, options) => {
    if (!windows.list[windows.PREVIEW]) return
    windows.list[windows.PREVIEW].webContents.send('conf-set', options);
  });
  ipcMain.on('preview-unload', (event) => {
    destroyPreviewView();
  });
})()

function createToasterView() {
  // Create our hidden browserview
  windows.list[windows.TOASTER] = new BrowserView({
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  windows.list[windows.TOASTER].webContents.loadURL(url.format({
    pathname: path.join(__dirname, 'toaster.html'),
    protocol: 'file:',
    slashes: true
  }));

  windows.list[windows.TOASTER].setBounds({x: 100, y: 100, width: 100, height: 100 });
  windows.list[windows.TOASTER].webContents.on('will-navigate', (event, url) => {
    console.log("Denying navigation to " + url)
    event.preventDefault();
  });
  // I 'unno
}
function destroyToasterView() {
  windows.list[windows.MAIN_WINDOW].removeBrowserView(windows.list[windows.TOASTER]);
  windows.list[windows.TOASTER].webContents.destroy();
  windows.list[windows.TOASTER] = null;
}

(function setupToasterIPC() {
  ipcMain.on('toaster-open', () => {
    createToasterView();
  });
  ipcMain.on('toaster-close', () => {
    destroyToasterView();
  });
  ipcMain.on('toaster-show', () => {
    windows.list[windows.MAIN_WINDOW].addBrowserView(windows.list[windows.TOASTER]);
    windows.list[windows.MAIN_WINDOW].setTopBrowserView(windows.list[windows.TOASTER]);
  });
  ipcMain.on('toaster-hide', () => {
    windows.list[windows.MAIN_WINDOW].removeBrowserView(windows.list[windows.TOASTER]);
  });
  ipcMain.on('toaster-bounds', (event, bounds) => {
    windows.list[windows.TOASTER].setBounds({
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height)
    });
  });
  ipcMain.on('toaster-toast', (event, msg) => {
    windows.list[windows.TOASTER].webContents.send('toast', msg);
  });
  ipcMain.on('toaster-awaiting', () => {
    windows.list[windows.MAIN_WINDOW].webContents.send('toaster-ready');
  });
})()

let is_main_instance = app.requestSingleInstanceLock();
app.on('second-instance', ((event, argv, cwd) => {
  if (windows.list[windows.MAIN_WINDOW]) {
    if (windows.list[windows.MAIN_WINDOW].isMinimized()) windows.list[windows.MAIN_WINDOW].restore();
    windows.list[windows.MAIN_WINDOW].focus();
    // Send file-open events for all arguments not beginning with '--'
    argv.forEach((val, index) => {
      if (index == 0) return; // FIXME: index >= 1 when npm start called directly
      if (val.startsWith('--')) return;
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
  
    // This is a bit unfortunate, but the window will show up with
    // a white background if we do not delay the splash window
    // creation.
    if (process.platform === "linux") {
      setTimeout(createSplashWindow, 200);
    } else {
      createSplashWindow();
    }
  });
  
  app.on('window-all-closed', () => {
    app.quit();
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
    windows.list[windows.SPLASH_WINDOW].hide();
    // Set our menu.
    menu.init();
    if (isDev) windows.list[windows.MAIN_WINDOW].toggleDevTools();
  });
} else {
  app.quit();
}
