const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const m = require('mithril');

const log         = require('electron-log');
const settings    = require('electron-app-settings');

const Emitter = require('../emitter.js');

const Notifier = require('./Notifier');

const MarkupPacksManager = require('../MarkupPackManager.js');

const {dialog} = require('@electron/remote');
const menu = require('@electron/remote').require('./menu');
const main_window = require('@electron/remote').getCurrentWindow();

let Files = Emitter({
  focused: 0,
  watcher: chokidar.watch([], {
    disableGlobbing: true,
    ignoreInitial: true,
  }),
  should_redraw: true,
  // Whether or not files are caching data rather than loading into the app. Can be released with releaseCache() or blocked with engageCache().
  caching: true,
  // Cached files for storing loading files when the app has not finished loading. Format is the result of buildFileEntry.
  cachedFiles: [
  ],
  // In-memory files
  loadedFiles: [
  ],
  validateFileEntry: (index) => {
    if (index < 0 || index >= Files.loadedFiles.length || index === undefined) {
      return false;
    }
    return true;
  },
  getFileText: (index) => {
    if (!Files.validateFileEntry(index)) return "";
    let text = Files.emit('get-text', index);
    return text || Files.loadedFiles[index].text;
  },
  setFileText: (index, text) => {
    if (!Files.validateFileEntry(index)) return false;
    Files.emit('set-text', index, text);
    Files.loadedFiles[index].text = text;
  },
  getFileName: (index) => {
    if (!Files.validateFileEntry(index)) return "Untitled";
    return Files.loadedFiles[index].name;
  },
  setFileName: (index, name) => {
    if (!Files.validateFileEntry(index)) return false;
    Files.loadedFiles[index].name = name;
  },
  getFilePath: (index) => {
    if (!Files.validateFileEntry(index)) return "";
    return Files.loadedFiles[index].filepath;
  },
  setFilePath: (index, filepath) => {
    if (!Files.validateFileEntry(index)) return false;
    Files.unwatchFile(index)
    Files.loadedFiles[index].filepath = filepath;
    Files.watchFile(index)
    Files.setFileName(index, path.basename(filepath));
  },
  getFileDirectory: (index) => {
    if (!Files.validateFileEntry(index)) return "";
    return path.dirname(Files.loadedFiles[index].filepath);
  },
  getFileLine: (index) => {
    if (!Files.validateFileEntry(index)) return 0;
    return Files.loadedFiles[index].current_line;
  },
  setFileLine: (index, num) => {
    if (!Files.validateFileEntry(index)) return false;
    Files.loadedFiles[index].current_line = num;
    m.redraw();
  },
  isFileDirty: (index) => {
    if (!Files.validateFileEntry(index)) return false;
    return Files.loadedFiles[index].is_dirty;
  },
  setFileDirty: (index, value) => {
    if (!Files.validateFileEntry(index)) return 0;
    Files.loadedFiles[index].is_dirty = value;
  },
  getFileExtension: (index) => {
    if (!Files.validateFileEntry(index)) return '';
    return Files.loadedFiles[index].name.split('.').pop();
  },
  setFileFocus: (index) => {
    if (index == Files.focused) return index;
    if (!Files.validateFileEntry(index)) return -1;
    Files.focused = index;
    Files.should_redraw = true;
    return Files.focused;
  },
  setFileSaved: (index, value) => {
    if (!Files.validateFileEntry(index)) return false;
    Files.loadedFiles[index].saved = value;
  },
  isFileSaved: index => {
    if (!Files.validateFileEntry(index)) return true;
    return Files.loadedFiles[index].saved;
  },
  isFileChanged: index => {
    if (!Files.validateFileEntry(index)) return false;
    return Files.loadedFiles[index].changed;
  },
  isFileDeleted: index => {
    if (!Files.validateFileEntry(index)) return true;
    return Files.loadedFiles[index].deleted;
  },
  setFileChanged: (index, changed, data=null) => {
    Files.loadedFiles[index].changed = changed ? true : false;
    if (changed) {
      if (settings.get('files.reload_on_change')) {
        // Only set text if the file is saved and our data arg is non-null.
        if (Files.isFileSaved(index) && data != null) {
          Files.setFileText(index, data)
          Files.setFileSaved(index, true)
          Files.setFileChanged(index, false)
          return
        }
      }

      if (settings.get('files.notify_on_change')) {
        const isSuperior = process.platform !== 'win32'; // ;)
        let options = {
           type: "info",
           title: "File Changed",
           message: "The Document \"" + Files.getFileName(index) + "\" has been changed by an outside entity.",
           detail: "Do you want to reload the file?",
           buttons: isSuperior ?  ["Ignore", "Reload"] : ["Reload", "Ignore"],
           defaultId: isSuperior ? 1 : 0
        };
        dialog.showMessageBox(main_window, options)
        .then(result => {
          let response = result.response
          if (response === (isSuperior ? 0 : 1)) {          // Ignore
          } else if (response === (isSuperior ? 1 : 0)) {   // Reload
            if (data != null) {
              Files.setFileText(index, data)
              Files.setFileSaved(index, true)
              Files.setFileChanged(index, false)
            }
          }
        }).catch(err => {
          log.error(err)
          Notifier.error({title: 'File change', body: err.toString()})
        });
      }
    }
    Files.should_redraw = true;
    m.redraw();
  },
  setFileDeleted: (index, isDeleted) => {
    if (!Files.validateFileEntry(index)) return false;
    Files.setFileSaved(index, false)
    Files.loadedFiles[index].deleted = isDeleted;
    m.redraw();
  },
  watchFile: index => {
    if (!Files.validateFileEntry(index)) return false;
    Files.watcher.add(Files.loadedFiles[index].filepath)
  },
  unwatchFile: index => {
    if (!Files.validateFileEntry(index)) return false;
    Files.watcher.unwatch(Files.loadedFiles[index].filepath)
  },
  closeFile: (index, force=false) => {
    if (index == -1) index = Files.focused;
    if (!Files.validateFileEntry(index)) return false;
    if (!Files.isFileSaved(index) && !force) {
      const isSuperior = process.platform !== 'win32'; // ;)
      let options = {
         type: "warning",
         title: "Unsaved Changes",
         message: "The Document \"" + Files.getFileName(index) + "\" has been modified.",
         detail: "Do you want to save your changes or discard them?",
         buttons: isSuperior ?  ["Discard", "Cancel", "Save"] : ["Save", "Discard", "Cancel"],
         defaultId: isSuperior ? 2 : 0
      };
      dialog.showMessageBox(main_window, options)
      .then(result => {
        let response = result.response
        if (response === (isSuperior ? 1 : 2)) {          // Cancel
        } else if (response === (isSuperior ? 2 : 0)) {   // Save
          Files.saveFile(index, false, false, (saved_index) => {
            Files.closeFile(saved_index);
          });
        } else if (response === (isSuperior ? 0 : 1)) {   // Discard
          Files.closeFile(index, true);
        }
      }).catch(err => {
        log.error(err)
        Notifier.error({title: 'Files.closeFile', body: err.toString()})
      });
      return;
    }

    Files.unwatchFile(index);

    Files.loadedFiles.splice(index, 1);
    if (index >= Files.loadedFiles.length) {
      Files.setFileFocus(index-1);
    } else {
      Files.setFileFocus(index);
    }
    Files.emit('file-close', index);
    Files.should_redraw = true;
    m.redraw();
    return true;
  },
  saveFile: (index=-1, save_as=false, rename=false, cb=()=>{}) => {
    if (index == -1) index = Files.focused;
    if (!Files.validateFileEntry(index)) return;
    if (Files.loadedFiles[index].filepath.length == 0 || Files.loadedFiles[index].saveAs == true || save_as == true) {
      // Get our target file extension and filter it against our supported extensions so it shows up as the first target in the save dialog.
      // TODO: I don't exactly like this solution as it adds an entry for each individual file extension. It would be nicer to have mappings to sets of file extensions (such as "md" and "markdown"). Perhaps it should just map filename filters to each Markup Pack's supports property?
      let fileext = path.extname(Files.loadedFiles[index].filepath || Files.loadedFiles[index].name)
      fileext = (fileext.length > 0 ? fileext.substring(1) : fileext)
      let desiredExtension;
      let extensions = []
      let extensionGroups = MarkupPacksManager.getSupportedExtensions();
      for (let [k, v] of Object.entries(extensionGroups)) {
        for (let i = 0; i < v.length; i++) {
          if (v[i] == fileext.toLowerCase()) {
            extensionName = k
            desiredExtension = v[i]
          } else {
            if (!extensions.includes(v[i])) {
              extensions.push(v[i])
            }
          }
        }
      }
      if (desiredExtension) extensions.unshift(desiredExtension);
      let filters = extensions.map(ext => {
        return {
          name: ext,
          extensions: [ ext ],
        }
      });
      let options = {
        defaultPath: Files.loadedFiles[index].filepath,
        filters: filters,
      }
      if (rename) {
        options.buttonLabel = "Rename";
      }
      dialog.showSaveDialog(main_window, options)
      .then(result => {
        if (result.canceled) return;
        let filename = result.filePath
        Files.loadedFiles[index].saveAs = false;
        Files.setFilePath(index, filename);
        Files.saveFile(index, false, rename, cb);
      }).catch(err => {
        log.error(err)
        Notifier.error({title: 'Files.saveFile', body: err.toString()})
      });
    } else {
      Files.loadedFiles[index].saving = true
      fs.writeFile(Files.loadedFiles[index].filepath, Files.getFileText(index), (err) => {
        Files.loadedFiles[index].saving = false
        if (err) {
          log.error(`File.saveFile "${Files.loadedFiles[index].filepath}"`, err.message);
          Files.loadedFiles[index].saved = false;
          Notifier.error({title: 'Files.saveFile', body: err.toString()})
          return;
        }
        Files.loadedFiles[index].saved = true;
        Files.loadedFiles[index].deleted = false;
        Files.loadedFiles[index].changed = false;
        menu.addRecentFile(Files.loadedFiles[index].filepath);
        cb(index);
        Files.checkState();
      });
    }
  },
  renameFile: (index) => {
    if (index == -1) index = Files.focused;
    let oldFilepath = Files.loadedFiles[index].filepath;
    Files.saveFile(index, true, true, () => {
      if (oldFilepath == Files.loadedFiles[index].filepath) return;
      fs.unlink(oldFilepath, (err) => {
        if (err) {
          log.error(`renameFile unlink "${oldFilepath}"`, err.message);
          Notifier.error({title: 'Files.renameFile', body: err.toString()})
          return;
        }
      });
    });
  },
  importFile: filepath => {
    let index = Files.focused;
    fs.readFile(filepath, 'utf-8', (err, data) => {
      if (err) {
        log.error(`importFile "${filepath}"`, err.message);
        Notifier.error({title: 'Files.importFile', body: err.toString()})
        return;
      }
      // Create a blank file if there is no valid file open.
      if (!Files.validateFileEntry(index)) {
        Files.loadedFiles.push(
          Files.buildFileEntry({name: "Untitled.md", text: data, saved: false})
        );
        index = Files.setFileFocus(Files.loadedFiles.length-1);
        Files.emit("file-load", Files.loadedFiles.length-1);
      } else {
        Files.emit('file-import', index, data);
      }
      Files.checkState();
    });
  },
  openFile: () => {
    dialog.showOpenDialog(main_window, {
      properties: ['openFile', 'multiSelections']
    }).then(result => {
      if (result.canceled) return
      for (let i = 0; i < result.filePaths.length; i++) {
        main_window.webContents.send('file-open', result.filePaths[i]);
        menu.addRecentFile(result.filePaths[i]);
      }
    }).catch(err => {
      log.error(err)
      Notifier.error({title: 'Files.openFile', body: err.toString()})
    })
  },
  loadFile: filepath => {
    // If the filepath is already loaded, focus it instead.
    for (let i = 0; i < Files.loadedFiles.length; i++) {
      if (Files.loadedFiles[i].filepath == filepath) {
        Files.setFileFocus(i);
        return;
      }
    }
    // Otherwise read the privided file at filepath.
    fs.readFile(filepath, 'utf-8', (err, data="") => {
      if (err && err.code != "ENOENT") {
        log.error(`Files.loadFile "${filepath}"`, err.message);
        Notifier.error({title: `Files.loadFile(${filepath})`, body: err.toString()})
        return;
      }
      if (Files.isCaching()) {
        Files.cachedFiles.push(Files.buildFileEntry({filepath: filepath, text: data}));
        Files.watchFile(Files.cachedFiles.length-1)
      } else {
        Files.loadedFiles.push(Files.buildFileEntry({filepath: filepath, text: data}));
        Files.watchFile(Files.loadedFiles.length-1)
        Files.setFileFocus(Files.loadedFiles.length-1);
        Files.emit("file-load", Files.loadedFiles.length-1);
        Files.checkState();
      }
      menu.addRecentFile(filepath);
    });
  },
  newFile: (extension) => {
    if (!extension) {
      let pack = MarkupPacksManager.getDefaultPack()
      for (let [k, v] of Object.entries(pack.supports)) {
        extension = v[0]
        break
      }
    }
    Files.loadedFiles.push(
      Files.buildFileEntry({name: "Untitled."+extension})
    );
    Files.setFileFocus(Files.loadedFiles.length-1);
    Files.emit("file-load", Files.loadedFiles.length-1);
    Files.checkState();
  },
  duplicateFile: () => {
    let index = Files.focused;
    if (index < 0) return
    Files.loadedFiles.push(
      Files.buildFileEntry({
        name: Files.loadedFiles[index].name,
        filepath: Files.loadedFiles[index].filepath,
        text: Files.loadedFiles[index].text,
        saveAs: true,
        saved: false
      })
    );
    Files.setFileFocus(Files.loadedFiles.length-1);
    Files.emit("file-load", Files.loadedFiles.length-1);
    Files.checkState();
  },
  checkState: () => {
    if (Files.focused < 0 && Files.loadedFiles.length > 0) {
      Files.focused = 1;
    } else if (Files.focused >= Files.loadedFiles.length) {
      Files.focused = Files.loadedFiles.length-1;
    }
    Files.should_redraw = true;
    m.redraw();
  },
  buildFileEntry: (obj) => {
    if (obj.filepath) {
      obj.name = path.basename(obj.filepath);
    }
    return Object.assign({
      name: "",
      filepath: "",
      text: "",
      saved: true,
      saving: false,  // if the file is currently saving
      changed: false, // on-disk file differs from in-memory
      deleted: false, // on-disk file has been deleted
      current_line: 0,
      is_dirty: true
    }, obj);
  },
  releaseCache: () => {
    Files.caching = false;
    for (let i = 0; i < Files.cachedFiles.length; i++) {
      Files.loadedFiles.push(Files.cachedFiles[i]);
      Files.setFileFocus(Files.loadedFiles.length-1);
      Files.emit("file-load", Files.loadedFiles.length-1);
    }
    Files.cachedFiles = []
    Files.checkState();
  },
  engageCache: () => {
    Files.caching = true;
  },
  isCaching: () => {
    return Files.caching;
  }
})

Files.watcher.on('change', (path, stats) => {
  if (!settings.get('files.watch')) {
    return
  }
  for (let i = 0; i < Files.loadedFiles.length; i++) {
    if (Files.loadedFiles[i].filepath == path) {
      fs.readFile(path, 'utf-8', (err, data="") => {
        if (err && err.code != "ENOENT") {
          log.error(`change event for file "${path}"`, err.message);
          Notifier.error({title: `File change ${path}`, body: err.toString()})
          return;
        }
        Files.setFileChanged(i, data !== Files.getFileText(i), data);
      });
    }
  }
})

Files.watcher.on('unlink', (path) => {
  if (!settings.get('files.watch')) {
    return
  }
  for (let i = 0; i < Files.loadedFiles.length; i++) {
    if (Files.loadedFiles[i].filepath == path) {
      Files.setFileDeleted(i, true);
    }
  }
});

module.exports = Files;
