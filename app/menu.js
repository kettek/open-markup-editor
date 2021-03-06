let electron = require('electron')

const {app, dialog, shell, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path  = require('path')
const log   = require('electron-log');

let windows = require('./windows');

let settings;
let menu;

function init () {
  settings = require('electron-app-settings');
  menu = electron.Menu.buildFromTemplate(getMenuTemplate())
  electron.Menu.setApplicationMenu(menu)
}

ipcMain.on('supported-markup', (event, types) => {
  let item = getMenuItem('New Type...')
  if (!item) return;
  item.submenu.clear();
  let i = 0
  for (let [k, v] of Object.entries(types)) {
    let label     = k
    let extension = v[0]
    item.submenu.insert(i++, new electron.MenuItem({
      label: label,
      click: () => {
        windows.list[windows.MAIN_WINDOW].webContents.send('file-new', extension);
      }
    }));

  }
})

function getMenuItem (label) {
  for (let i = 0; i < menu.items.length; i++) {
    let menuItem = menu.items[i].submenu.items.find(function (item) {
      return item.label === label
    })
    if (menuItem) return menuItem
  }
}

function addRecentFile(file) {
  let recents = settings.get('recent_files');
  recents = recents.filter(recent => recent.filepath !== file);
  recents.unshift({
    filepath: file,
    name: path.basename(file)
  });
  if (recents.length > 8) {
    recents.splice(8);
  }
  settings.set('recent_files', recents);
  updateOpenRecentMenu();
}

function clearRecent() {
  settings.set('recent_files', []);
  settings.get('recent_files').length = 0;
  windows.list[windows.MAIN_WINDOW].webContents.send('clear-recent');
  updateOpenRecentMenu();
}

function updateOpenRecentMenu() {
  let recent_menu = getMenuItem("Open Recent");
  if (!recent_menu) return;
  recent_menu.submenu.clear();
  let recents = settings.get('recent_files');
  for (var i = 0; i < recents.length; i++) {
    let label     = recents[i].name;
    let filepath  = recents[i].filepath;
    recent_menu.submenu.insert(i, new electron.MenuItem({
      label: label,
      click: () => {
        windows.list[windows.MAIN_WINDOW].webContents.send('file-open', filepath);
      }
    }));
  }
  recent_menu.submenu.append(new electron.MenuItem({ type: "separator" }));
  recent_menu.submenu.append(new electron.MenuItem({
    label: "Clear",
    click: clearRecent
  }));
  electron.Menu.setApplicationMenu(menu);
  windows.list[windows.MAIN_WINDOW].webContents.send('redraw');
}

function getMenuTemplate () {
  let template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New...',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            windows.list[windows.MAIN_WINDOW].webContents.send('file-new');
          }
        },
        {
          label: 'New Type...',
          submenu: [
            {
              label: 'hmm',
            }
          ],
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            dialog.showOpenDialog(windows.list[windows.MAIN_WINDOW], {
              properties: ['openFile', 'multiSelections']
            }).then(result => {
              if (result.canceled) return
              for (let i = 0; i < result.filePaths.length; i++) {
                windows.list[windows.MAIN_WINDOW].webContents.send('file-open', result.filePaths[i]);
              }
            }).catch(err => {
              log.error(err)
            })
          }
        },
        {
          label: 'Open Recent',
          submenu: settings.get('recent_files').map(el => {
            return {
              label: el.name,
              click: () => {
                windows.list[windows.MAIN_WINDOW].webContents.send('file-open', el.filepath);
              }
            }
          }).concat([
            {
              type: 'separator'
            },
            {
              label: "Clear",
              click: clearRecent
            }
          ])
        },
        {
          type: 'separator'
        },
        {
          label: 'Import...',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            dialog.showOpenDialog(windows.list[windows.MAIN_WINDOW], {
              properties: ['openFile', 'multiSelections']
            }).then(result => {
              if (result.canceled) return
              for (let i = 0; i < result.filePaths.length; i++) {
                windows.list[windows.MAIN_WINDOW].webContents.send('file-import', result.filePaths[i]);
              }
            }).catch(err => {
              log.error(err)
            })
          }
        },
        {
          label: 'Duplicate...',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            windows.list[windows.MAIN_WINDOW].webContents.send('file-duplicate');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Save...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            windows.list[windows.MAIN_WINDOW].webContents.send('file-save', -1);
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            windows.list[windows.MAIN_WINDOW].webContents.send('file-save-as', -1);
          }
        },
        {
          label: 'Rename',
          click: () => {
            windows.list[windows.MAIN_WINDOW].webContents.send('file-rename', -1);
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            windows.list[windows.MAIN_WINDOW].webContents.send('file-close', -1);
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        },
        {
          type: 'separator'
        },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => windows.list[windows.MAIN_WINDOW].webContents.send('conf-show')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Full Screen',
          type: 'checkbox',
          accelerator: process.platform === 'darwin'
            ? 'Ctrl+Command+F'
            : 'F11',
          click: () => {
            if (windows.list[windows.MAIN_WINDOW].isFullScreen()) {
              windows.list[windows.MAIN_WINDOW].setFullScreen(false);
            } else {
              windows.list[windows.MAIN_WINDOW].setFullScreen(true);
            }
          }
        },
        {
          label: 'Float on Top',
          type: 'checkbox',
          click: () => {
            if (windows.list[windows.MAIN_WINDOW].isAlwaysOnTop()) {
              windows.list[windows.MAIN_WINDOW].setAlwaysOnTop(false);
            } else {
              windows.list[windows.MAIN_WINDOW].setAlwaysOnTop(true);
            }
          }
        },
        {
          type: 'separator'
        },
        isDev ?
        {
          label: 'Developer',
          submenu: [
            {
              label: 'Developer Tools',
              accelerator: process.platform === 'darwin'
                ? 'Alt+Command+I'
                : 'Ctrl+Shift+I',
              click: () => windows.list[windows.MAIN_WINDOW].toggleDevTools()
            },
          ]
        }
        :
        { label: '' }
      ]
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Learn more about OME',
          click: () => shell.openExternal("https://kettek.net/s/OME")
        },
        {
          label: 'Contribute on GitHub',
          click: () => shell.openExternal("https://github.com/kettek/open-markup-editor")
        },
        {
          type: 'separator'
        },
        {
          label: 'Report an Issue...',
          click: () => shell.openExternal("https://github.com/kettek/open-markup-editor/issues/new")
        },
      ]
    }
  ]

  if (process.platform !== 'darwin') {
    template[template.length-1].submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'About ' + 'OME',
        click: () => {
          windows.list[windows.ABOUT_WINDOW].webContents.send('about-show');
          windows.list[windows.ABOUT_WINDOW].show();
        }
      }
    )
  }

  if (process.platform === 'darwin') {
    template.unshift({
      label: 'OME',
      submenu: [
        {
          label: 'About ' + 'OME',
          click: () => {
            let size = windows.list[windows.MAIN_WINDOW].getSize()
            size[0] = Math.round(size[0]*.5)
            size[1] = Math.round(size[1]*.5)
            windows.list[windows.ABOUT_WINDOW].setSize(size[0], size[1], false);
            windows.list[windows.ABOUT_WINDOW].webContents.send('about-show');
            windows.list[windows.ABOUT_WINDOW].show();
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Preferences',
          accelerator: 'Cmd+,',
          click: () => windows.list[windows.MAIN_WINDOW].webContents.send('conf-show')
        },
        {
          type: 'separator'
        },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide ' + 'OME',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    })

    // Add Window menu (OS X)
    template.splice(5, 0, {
      label: 'Window',
      role: 'window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      ]
    })
  }

  if (process.platform !== 'darwin') {
    template[0].submenu.push({
      type: 'separator'
    })

    template[0].submenu.push({
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      click: () => app.quit()
    })
  }

  return template
}

module.exports = {
  init: init,
  addRecentFile: addRecentFile
}
