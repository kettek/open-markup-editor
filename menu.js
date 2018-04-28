module.exports = {
  init: init
}

let electron = require('electron')

const {app, config, dialog, shell, remote, ipcMain } = require('electron');

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
          click: () => {dialog.showOpenDialog({
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
          label: process.platform === 'win32'
            ? 'Close'
            : 'Close Window',
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
          click: () => windows.list[windows.MAIN_WINDOW].dispatch('preferences')
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
          click: () => windows.list[windows.MAIN_WINDOW].toggleFullScreen()
        },
        {
          label: 'Float on Top',
          type: 'checkbox',
          click: () => windows.list[windows.MAIN_WINDOW].toggleAlwaysOnTop()
        },
        {
          type: 'separator'
        },
        {
          label: 'Go Back',
          accelerator: 'Esc',
          click: () => windows.list[windows.MAIN_WINDOW].dispatch('escapeBack')
        },
        {
          type: 'separator'
        },
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
      ]
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Learn more about OME',
          click: () => shell.openExternal(config.HOME_PAGE_URL)
        },
        {
          label: 'Contribute on GitHub',
          click: () => shell.openExternal(config.GITHUB_URL)
        },
        {
          type: 'separator'
        },
        {
          label: 'Report an Issue...',
          click: () => shell.openExternal(config.GITHUB_URL_ISSUES)
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
          click: () => windows.list[windows.MAIN_WINDOW].dispatch('preferences')
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
          accelerator: 'Command+Q',
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

  // Add "File > Quit" menu item so Linux distros where the system tray icon is
  // missing will have a way to quit the app.
  if (process.platform === 'linux') {
    // File menu (Linux)
    template[0].submenu.push({
      label: 'Quit',
      click: () => app.quit()
    })
  }

  return template
}
