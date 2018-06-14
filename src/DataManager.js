const settings  = require('electron-app-settings');
const path      = require('path');
const fs        = require('fs');
const log       = require('electron-log');
const Emitter   = require('./emitter');
const tar       = require('tar');

const DataManager = Emitter({
  paths: [
  ],
  addPath: (path_obj, pos=-1) => {
    path_obj = Object.assign({path: "", writable: false}, path_obj);
    DataManager.paths.splice(pos, 0, path_obj);
    log.info("Added DataManager path: " + path_obj.path);
  },
  getFiles: (dir, on_finish=()=>{}) => {
    let parsed_paths  = 0;
    let total_paths   = DataManager.paths.length;
    let total_files   = [];
    let errors        = [];
    DataManager.paths.forEach((path_obj, path_i) => {
      let dir_path = path.join(path_obj.path, dir);
      fs.readdir(dir_path, (err, files) => {
        parsed_paths++;
        if (err) {
          errors[path_i] = err;
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
  fileExists: (filepath, on_finish=()=>{}) => {
    let parsed_paths  = 0;
    let total_paths   = DataManager.paths.length;
    let errors        = [];
    DataManager.paths.forEach((path_obj, path_i) => {
      let dir_path = path.join(path_obj.path, filepath);
      fs.access(dir_path, fs.constants_F_OK, err => {
        parsed_paths++;
        if (err) {
          errors.push(err);
        }
        if (parsed_paths >= total_paths) {
          on_finish(errors.length == total_paths ? errors : null);
        }
      });
    });
  },
  unpackFile: (source, target, on_finish=()=>{}) => {
    // FIXME: This is pretty ugly. Also we're not properly handling errors because node tar is weird.
    let output_dir = path.join(DataManager.paths[DataManager.paths.length-1].path, target);
    let package_type = 0;
    let package_root = '';
    tar.t({
      file: source,
      onentry: entry => {
        if (package_type == 1) return;
        if (entry.path == 'package.json') {
          package_root = path.basename(source);
          package_type = 1; // make dir
        } else if (entry.path.match(/^[^\/]*\/package\.json/gi)) {
          package_root = path.basename(path.dirname(entry.path));
          package_type = 2; // contains dir
        }
      }
    }, (err) => {
      let output_path = path.join(output_dir, package_root);
      function extract() {
        tar.x({
          file: source,
          cwd: path.join(output_dir, package_type == 1 ? package_root : '')
        }, (e) => {
          on_finish(null, output_path);
        });
      }

      if (package_type == 1) {
        fs.mkdir(output_path, extract);
      } else {
        extract();
      }
    });
  }
});

module.exports = DataManager;
