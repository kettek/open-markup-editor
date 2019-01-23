const settings  = require('electron-app-settings');
const path      = require('path');
const fs        = require('fs');
const log       = require('electron-log');
const Emitter   = require('./emitter');
const tar       = require('tar');
const rimraf    = require('rimraf');

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
            files[file_i] = { root: path_obj.path, path: file, fullpath: path.join(dir_path, file) };
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
    let output_dir    = path.join(DataManager.paths[0].path, target);
    console.log(DataManager.paths);
    let package_type  = 0;
    let package_root  = '';
    let errors        = [];
    tar.t({
      file: source,
      onwarn: (message, data) => {
        errors.push(message + data);
      },
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
          onwarn: (message, data) => {
            errors.push(message + data);
          },
          cwd: path.join(output_dir, package_type == 1 ? package_root : '')
        }, (e) => {
          on_finish(errors.length > 0 ? errors : null, { root: DataManager.paths[0].path, path: package_root, fullpath: output_path });
        });
      }
      // Let's always attempt to create the base output dir first just in case the user deletes it while OME is running.
      fs.access(output_dir, fs.constants.W_OK, (err) => {
        if (err) {
          if (err.code !== 'ENOENT') {
            errors.push(err)
            on_finish(errors, { root: DataManager.paths[0].path, path: package_root, fullpath: output_path });
          } else {
            fs.mkdir(output_dir, (err) => {
              if (err) {
                errors.push(err)
                on_finish(errors, { root: DataManager.paths[0].path, path: package_root, fullpath: output_path });
                return;
              }
              if (package_type == 1) {
                fs.mkdir(output_path, { recursive: true }, extract);
              } else {
                extract();
              }
            });
          }
        } else {
          if (package_type == 1) {
            fs.mkdir(output_path, { recursive: true }, extract);
          } else {
            extract();
          }
        }
      });
    });
  },
  constrained: (filepath, has_write_access) => {
    return DataManager.paths.map(p => {
      let index = filepath.lastIndexOf(p.path, 0);
      if (index === 0 && (has_write_access == 'undefined' || has_write_access == p.writable)) {
        return filepath;
      }
      return null;
    }).filter(o => o !== null);
  },
  deleteDirectory: (target, on_finish=()=>{}) => {
    DataManager.constrained(target, true).forEach(file => {
      console.log('delete ' + file);
      rimraf(file, on_finish);
    });
  }
});

module.exports = DataManager;
