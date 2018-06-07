const settings  = require('electron-app-settings');
const path      = require('path');
const fs        = require('fs');
const log       = require('electron-log');
const Emitter   = require('./emitter');

const DataManager = Emitter({
  paths: [
  ],
  addPath: (path, pos=-1) => {
    DataManager.paths.splice(pos, 0, path);
    log.info("Added DataManager path: " + path);
  },
  getFiles: (dir, on_finish=()=>{}) => {
    let parsed_paths  = 0;
    let total_paths   = DataManager.paths.length;
    let total_files   = [];
    let errors        = [];
    DataManager.paths.forEach((dir_path, dir_i) => {
      dir_path = path.join(dir_path, dir);
      fs.readdir(dir_path, (err, files) => {
        parsed_paths++;
        if (err) {
          errors[dir_i] = err;
        } else {
          files.forEach((file, file_i) => {
            files[file_i] = path.join(dir_path, file);
          });
          total_files = total_files.concat(files);
        }
        if (parsed_paths >= total_paths) {
          on_finish(errors, total_files);
        }
      });
    });
  },
  fileExists: (path, on_finish=()=>{}) => {
    let parsed_paths  = 0;
    let total_paths   = DataManager.paths.length;
    let errors        = [];
    DataManager.paths.forEach((dir_path, dir_i) => {
      fs.access(path.join(dir_path, path), fs.constants_F_OK, err => {
        parsed_paths++;
        if (err) {
          errors.push(err);
        }
        if (parsed_paths >= total_paths) {
          on_finish(errors.length == total_paths ? errors : null);
        }
      });
    });
  }
});

module.exports = DataManager;
