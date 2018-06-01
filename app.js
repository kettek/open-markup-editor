const {app, BrowserWindow, Menu, dialog, ipcMain} = require('electron');
const log       = require('electron-log');
                log.transports.console.level = 'info';
                log.transports.file.level = 'info';
const settings  = require('electron-app-settings');
const path      = require('path');
const url       = require('url');
const menu      = require('./menu');

let windows   = require('./windows');

function createMainWindow() {
  windows.list[windows.MAIN_WINDOW] = new BrowserWindow({ width: settings.get("window.width"), height: settings.get("window.height"), show: false });
  windows.list[windows.MAIN_WINDOW].setBounds({x: settings.get("window.left"), y: settings.get("window.top"), width: settings.get("window.width"), height: settings.get("window.height")});

  windows.list[windows.MAIN_WINDOW].loadURL(url.format({
    pathname: path.join(__dirname, 'main.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Send our settings to the renderer when it loads.
  windows.list[windows.MAIN_WINDOW].webContents.on('did-finish-load', () => {
    windows.list[windows.MAIN_WINDOW].webContents.send('init');
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
});
