const {app, BrowserWindow, Menu, dialog, ipcMain} = require('electron');
const settings  = require('electron-settings');
const path      = require('path');
const url       = require('url');
const menu      = require('./menu');

const MarkupPacks = require('./src/models/MarkupPacks');
const RenderPacks = require('./src/models/RenderPacks');

let windows   = require('./windows');

function createMainWindow() {
  windows.list[windows.MAIN_WINDOW] = new BrowserWindow({ width: settings.get("window.width"), height: settings.get("window.height"), show: false });
  windows.list[windows.MAIN_WINDOW].setBounds({x: settings.get("window.left"), y: settings.get("window.top"), width: settings.get("window.width"), height: settings.get("window.height")});

  windows.list[windows.MAIN_WINDOW].loadURL(url.format({
    pathname: path.join(__dirname, 'main.html'),
    protocol: 'file:',
    slashes: true
  }));

  windows.list[windows.MAIN_WINDOW].on('ready-to-show', () => {
    windows.list[windows.MAIN_WINDOW].show();
  });

  // Send our settings to the renderer when it loads.
  windows.list[windows.MAIN_WINDOW].webContents.on('did-finish-load', () => {
    // Send our pertinent settings to the main app.
    windows.list[windows.MAIN_WINDOW].webContents.send('set-config', settings.get('config'));
  });

  windows.list[windows.MAIN_WINDOW].on('close', () => {
    let bounds = windows.list[windows.MAIN_WINDOW].getBounds();
    settings.set("window.left", bounds.x);
    settings.set("window.top", bounds.y);
    settings.set("window.width", bounds.width);
    settings.set("window.height", bounds.height);
    windows.list[windows.MAIN_WINDOW] = null;
  });
}

app.on('ready', () => {
  // ---- Defaults ----
  if (!settings.has("window.width")) settings.set("window.width", 800);
  if (!settings.has("window.height")) settings.set("window.height", 600);
  if (!settings.has("window.left")) settings.set("window.left", 0);
  if (!settings.has("window.top")) settings.set("window.top", 0);
  if (!settings.has("recent_files")) settings.set("recent_files", []);
  if (!settings.has("filetypes")) settings.set("filetypes", {"md": "$OME_MARKUP_PACKS/ome-mp-markdown-it" });
  if (!settings.has("renderpack")) settings.set("renderpack", "$OME_RENDER_PACKS/ome-rp-default");
  if (!settings.has("config.editorpack")) settings.set("config.editorpack", "$OME_EDITOR_PACKS/ome-ep-codemirror");
  // ---- ----
  for (const [key, value] of Object.entries(settings.get("filetypes"))) {
    MarkupPacks.setPack(value);
  }
  // ---- ----
  RenderPacks.loadPack(settings.get("renderpack"));
  // ---- ----
  menu.init();

  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
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
ipcMain.on('update-settings', (event, config) => {
  settings.set(config.key, config.value);
});
