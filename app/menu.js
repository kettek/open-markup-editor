module.exports = {
  init: init
}

let electron = require('electron')

const {app, dialog, shell, remote, ipcMain } = require('electron');
const isDev = require('electron-is-dev');

let windows = require('./windows');

let menu;

function init () {
  menu = electron.Menu.buildFromTemplate(getMenuTemplate())
  electron.Menu.setApplicationMenu(menu)
}

function getMenuItem (label) {
  for (let i = 0; i < menu.items.length; i++) {
    let menuItem = menu.items[i].submenu.items.find(function (item) {
      return item.label === label
    })
    if (menuItem) return menuItem
  }
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
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {dialog.showOpenDialog(windows.list[windows.MAIN_WINDOW], {
            properties: ['openFile', 'multiSelections']},
            (fileNames) => {
              if (fileNames === undefined) return;
              for (let i = 0; i < fileNames.length; i++) {
                windows.list[windows.MAIN_WINDOW].webContents.send('file-open', fileNames[i]);
              }
          })}
        },
        {
          type: 'separator'
        },
        {
          label: 'Import...',
          accelerator: 'CmdOrCtrl+I',
          click: () => {dialog.showOpenDialog(windows.list[windows.MAIN_WINDOW], {
            properties: ['openFile', 'multiSelections']},
            (fileNames) => {
              if (fileNames === undefined) return;
              for (let i = 0; i < fileNames.length; i++) {
                windows.list[windows.MAIN_WINDOW].webContents.send('file-import', fileNames[i]);
              }
          })}
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
        }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: 'OME',
      submenu: [
        {
          label: 'About ' + 'OME',
          role: 'about'
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
