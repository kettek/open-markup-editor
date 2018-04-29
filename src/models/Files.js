const fs = require('fs');
const path = require('path');

const m = require('mithril');

const {dialog} = require('electron').remote;

let Files = {
  focused: 0,
  should_redraw: true,
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
    return Files.loadedFiles[index].text;
  },
  setFileText: (index, text) => {
    if (!Files.validateFileEntry(index)) return false;
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
    Files.loadedFiles[index].filepath = filepath;
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
    if (index == Files.focused) return;
    if (!Files.validateFileEntry(index)) return;
    Files.focused = index;
    Files.should_redraw = true;
  },
  setFileSaved: (index, value) => {
    if (!Files.validateFileEntry(index)) return false;
    Files.loadedFiles[index].saved = value;
  },
  isFileSaved: index => {
    if (!Files.validateFileEntry(index)) return false;
    return Files.loadedFiles[index].saved;
  },
  closeFile: index => {
    if (index == -1) index = Files.focused;
    if (!Files.validateFileEntry(index)) return false;
    Files.loadedFiles.splice(index, 1);
    if (index >= Files.loadedFiles.length) {
      Files.setFileFocus(index-1);
    } else {
      Files.setFileFocus(index);
    }
    Files.should_redraw = true;
    m.redraw();
    return true;
  },
  saveFile: (index, save_as) => {
    if (index == -1) index = Files.focused;
    if (!Files.validateFileEntry(index)) return;
    if (Files.loadedFiles[index].filepath.length == 0 || save_as == true) {
      dialog.showSaveDialog(filename => {
        if (filename === undefined) return;
        Files.setFilePath(index, filename);
        Files.saveFile(index);
      });
    } else {
      fs.writeFile(Files.loadedFiles[index].filepath, Files.loadedFiles[index].text, (err) => {
        if (err) {
          console.log(err.message);
          Files.loadedFiles[index].saved = false;
          return;
        }
        Files.loadedFiles[index].saved = true;
        Files.checkState();
      });
    }
  },
  loadFile: filepath => {
    fs.readFile(filepath, 'utf-8', (err, data) => {
      if (err) {
        console.log(err.message);
        return;
      }
      Files.loadedFiles.push(Files.buildFileEntry({filepath: filepath, text: data}));
      Files.setFileFocus(Files.loadedFiles.length-1);
      Files.checkState();
    });
  },
  newFile: () => {
    Files.loadedFiles.push(
      Files.buildFileEntry({name: "Untitled.md"})
    );
    Files.setFileFocus(Files.loadedFiles.length-1);
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
      saved: false,
      current_line: 0,
      is_dirty: true
    }, obj);
  }
}

module.exports = Files;
