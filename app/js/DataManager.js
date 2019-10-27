const { app }   = require('electron').remote;
const settings  = require('electron-app-settings');
const path      = require('path');
const fs        = require('fs-extra');
const log       = require('electron-log');
const Emitter   = require('./emitter');
const tar       = require('tar');
const cryptiles = require('@hapi/cryptiles');

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
  unpackFileToTemp: (source, on_finish=()=>{}) => {
    let output_dir    = app.getPath('temp');
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
          on_finish(errors.length > 0 ? errors : null, { path: package_root, fullpath: output_path });
        });
      }
      // Ensure that the output directory exists.
      fs.ensureDir(output_dir, 0o2775, err => {
        if (err) {
          errors.push(err)
          on_finish(errors, { path: package_root, fullpath: output_path });
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
  moveToTemp: (source, on_finish=()=>{}) => {
    let root     = path.join(app.getPath('temp'), cryptiles.randomString(16))
    let basename = path.basename(source)
    let fullpath = path.join(root, basename)
    let errors = []
    fs.move(path.join(DataManager.paths[0].path, source), path.join(root, basename), err => {
      if (err) errors.push(err)
      on_finish(errors, {
        root: root,
        path: basename,
        fullpath: fullpath,
      })
    })
  },
  restoreFromTemp: (source, target, on_finish=()=>{}) => {
    let root = path.join(DataManager.paths[0].path, target);
    let basename = source;
    let fullpath = path.join(root, basename);
    let errors = [];
    fs.move(path.join(app.getPath('temp'), source), fullpath, err => {
      if (err) errors.push(err)
      on_finish(errors, {
        root: DataManager.paths[0].path,
        path: basename,
        fullpath: fullpath,
      })
    });
  },
  unpackFile: (source, target, on_finish=()=>{}) => {
    // FIXME: This is pretty ugly. Also we're not properly handling errors because node tar is weird.
    let output_dir    = path.join(DataManager.paths[0].path, target);
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
      // Ensure that the output directory ("DataPath/packs/") exists.
      fs.ensureDir(output_dir, 0o2775, err => {
        if (err) {
          errors.push(err)
          on_finish(errors, { root: DataManager.paths[0].path, path: package_root, fullpath: output_path });
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
      fs.remove(file, on_finish);
    });
  }
});

module.exports = DataManager;
