const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const m = require('mithril');

const Emitter = require('../emitter.js');

const MarkupPacksManager = require('../MarkupPackManager.js');

const {dialog} = require('electron').remote;
const menu = require('electron').remote.require('./menu')
const main_window = require('electron').remote.getCurrentWindow()

let Files = Emitter({
  focused: 0,
  watcher: chokidar.watch([], {
    persistent: false,
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
    if (!Files.validateFileEntry(index)) return false;
    return Files.loadedFiles[index].saved;
  },
  isFileChanged: index => {
    if (!Files.validateFileEntry(index)) return false;
    return Files.loadedFiles[index].changed;
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
      dialog.showMessageBox(main_window, options, (response) => {
        if (response === (isSuperior ? 1 : 2)) {          // Cancel
        } else if (response === (isSuperior ? 2 : 0)) {   // Save
          Files.saveFile(index, false, (saved_index) => {
            Files.closeFile(saved_index);
          });
        } else if (response === (isSuperior ? 0 : 1)) {   // Discard
          Files.closeFile(index, true);
        }
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
  saveFile: (index, save_as=false, cb=()=>{}) => {
    if (index == -1) index = Files.focused;
    if (!Files.validateFileEntry(index)) return;
    if (Files.loadedFiles[index].filepath.length == 0 || Files.loadedFiles[index].saveAs == true || save_as == true) {
      // Get our target file extension and filter it against our supported extensions so it shows up as the first target in the save dialog.
      // TODO: I don't exactly like this solution as it adds an entry for each individual file extension. It would be nicer to have mappings to sets of file extensions (such as "md" and "markdown"). Perhaps it should just map filename filters to each Markup Pack's supports property?
      let fileext = path.extname(Files.loadedFiles[index].filepath || Files.loadedFiles[index].name)
      fileext = (fileext.length > 0 ? fileext.substring(1) : fileext)
      let desiredExtension;
      let extensions = MarkupPacksManager.getSupportedExtensions().filter(ext => {
        if (ext == fileext) {
          desiredExtension = ext;
          return false;
        }
        return true;
      });
      if (desiredExtension) extensions.unshift(desiredExtension);
      let filters = extensions.map(ext => {
        return {
          name: ext,
          extensions: [ ext ],
        }
      });
      dialog.showSaveDialog(main_window, {
        defaultPath: Files.loadedFiles[index].filepath,
        filters: filters
      }, filename => {
        if (filename === undefined) return;
        Files.loadedFiles[index].saveAs = false;
        Files.setFilePath(index, filename);
        Files.saveFile(index, false, cb);
      });
    } else {
      Files.loadedFiles[index].saving = true
      fs.writeFile(Files.loadedFiles[index].filepath, Files.getFileText(index), (err) => {
        Files.loadedFiles[index].saving = false
        if (err) {
          console.log(err.message);
          Files.loadedFiles[index].saved = false;
          return;
        }
        Files.loadedFiles[index].saved = true;
        Files.loadedFiles[index].changed = false;
        cb(index);
        Files.checkState();
      });
    }
  },
  importFile: filepath => {
    let index = Files.focused;
    fs.readFile(filepath, 'utf-8', (err, data) => {
      if (err) {
        console.log(err.message);
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
    }, fileNames => {
      if (fileNames === undefined) return;
      for (let i = 0; i < fileNames.length; i++) {
        main_window.webContents.send('file-open', fileNames[i]);
        menu.addRecentFile(fileNames[i]);
      }
    })
  },
  loadFile: filepath => {
    fs.readFile(filepath, 'utf-8', (err, data="") => {
      if (err && err.code != "ENOENT") {
        console.log(err.message);
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
    });
  },
  newFile: () => {
    Files.loadedFiles.push(
      Files.buildFileEntry({name: "Untitled.md"})
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
  for (let i = 0; i < Files.loadedFiles.length; i++) {
    if (Files.loadedFiles[i].filepath == path) {
      fs.readFile(path, 'utf-8', (err, data="") => {
        if (err && err.code != "ENOENT") {
          console.log(err.message);
          return;
        }
        Files.loadedFiles[i].changed = data !== Files.getFileText(i);
        Files.should_redraw = true;
        m.redraw();
      });
    }
  }
})

module.exports = Files;
