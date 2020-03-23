const settings    = require('electron-app-settings');
const m           = require('mithril');
const fs          = require('fs-extra');
const { app }     = require('electron').remote;
const path        = require('path');
const log         = require('electron-log');
const https       = require('https');
const url         = require('url');
const semver      = require('semver');
const DataManager = require('./DataManager');
const Emitter     = require('./emitter');

function makePackManager(module_name, obj={}) {
  let mm = Emitter(Object.assign({
    pack_type: 'extension',
    pack_type_short: 'ext',
    packs: [],
    // Packs that are pending loading. For each pack detected by populate, a number is added to this. For each pack that finishes loading, successfully or not, this number is decreased. When it reaches 0, "populated" is emitted.
    pending_packs: 0,
    reducePendingPacks: (on_finish) => {
      mm.pending_packs = mm.pending_packs - 1;
      if (mm.pending_packs <= 0) {
        on_finish();
      }
    },
    mod_replace_string: "",
    populate: (dir) => {
      return new Promise((finalResolve, finalReject) => {
        DataManager.getFiles(dir, async (errors, data_files) => {
          mm.pending_packs += data_files.length
          for (const data_file of data_files) {
            try {
              let result = await new Promise((resolve, reject) => {
                log.info(" Loading " + data_file.fullpath + "...");
                try {
                  fs.accessSync(path.join(data_file.fullpath, 'package.json'), fs.constants.F_OK);
                } catch (err) {
                  log.warn("  ...ignoring, missing 'package.json'.");
                  resolve();
                  return;
                }

                try {
                  mm.load(data_file, () => {
                    log.info("  ...OK");
                    resolve();
                  });
                } catch (e) {
                  if (e.code === 'INCORRECT_PACK_TYPE') {
                    // TODO: Show a popup dialog telling the user what is wrong and whether or not to delete the pack.
                    DataManager.deleteDirectory(data_file.fullpath, err => {
                      if (err) {
                        reject(err);
                        return
                      }
                      log.info("  ...YEET");
                      reject(e)
                    });
                  } else {
                    log.warn("  ...NOKAY");
                    reject(e)
                  }
                }
              });
              mm.reducePendingPacks(finalResolve);
            } catch(err) {
              mm.reducePendingPacks(finalResolve);
            }
          }
        });
      });
    },
    load: (data_file, on_packload=()=>{}) => {
      try {
        let extension = mm.create(data_file.fullpath);
        extension.read_only = DataManager.paths[DataManager.paths.map(o => o.path).indexOf(data_file.root)].writable ? false : true;
        mm.packs.push(extension);
        mm.emit('load', extension);
        on_packload(extension)
      } catch (e) {
        throw e;
      }
    },
    unload: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      let extension = mm.packs[index];
      mm.disable(index);
      mm.emit('unload', extension);
      mm.packs.splice(index, 1);
      m.redraw();
    },
    setup: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      let extension = mm.packs[index];
      if (extension.did_setup) return true;
      extension.setup(extension);
      extension.did_setup = true;
      return true;
    },
    setDefault: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      for (let i = 0; i < mm.packs.length; i++) {
        settings.set(mm.packs[i].key + '.default', false)
      }
      settings.set(mm.packs[index].key + '.default', true)
    },
    isDefault: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      return settings.get(mm.packs[index].key+'.default')
    },
    getDefaultPack: () => {
      for (let i = 0; i < mm.packs.length; i++) {
        if (settings.get(mm.packs[i].key + '.default')) {
          return mm.packs[i]
        }
      }
      return mm.packs[0]
    },
    enable: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      if (mm.packs[index].enabled) return true;
      // Setup if it hasn't been done already
      mm.setup(index);
      // Enable that beezy
      mm.packs[index].enabled = mm.packs[index].emit('enable') === false ? false : true;
      // Hook pack into global settings if it is listening for it
      if (mm.packs[index].on['global-conf-set']) {
        mm.packs[index]._global_conf_set = (arg) => {
          mm.packs[index].emit('global-conf-set', arg.key, arg.value, arg.is_default);
        };
        settings.on('set', mm.packs[index]._global_conf_set);
      }
      settings.set(mm.packs[index].key + '.disabled', !mm.packs[index].enabled);
      m.redraw();
    },
    disable: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      if (!mm.packs[index].enabled) return false;
      mm.packs[index].enabled = mm.packs[index].emit('disable') === false ? true : false;
      if (mm.packs[index]._global_conf_set) {
        settings.off('set', mm.packs[index]._global_conf_set);
        delete mm.packs[index]._global_conf_set;
      }
      settings.set(mm.packs[index].key+'.disabled', !mm.packs[index].enabled);
      m.redraw();

      return true;
    },
    toggle: index => {
      if (index < 0 || index >= mm.packs.length) return;
      if (mm.packs[index].enabled) mm.disable(index);
      else mm.enable(index);
    },
    getByShortName: short_name => {
      return mm.packs.filter(mod => {return mod.short_name == short_name});
    },
    create: filepath => {
      let pkg = JSON.parse(fs.readFileSync(path.join(filepath, 'package.json'), 'utf8'));

      mm.validate(pkg, filepath);

      let mod = Emitter(Object.assign({
        short_name: pkg.name,
        repository: pkg.repository ? pkg.repository : '',
        version:    '',
        updates:    {major: null, minor: null, patch: null},
        filepath:   filepath,
        name:       '',
        key:        module_name+'.undefined',
        conf_ui:    [],
        did_setup:  false,
        updating:   false,
        checking:   false,
        setup:      () => {},
        conf:       (obj, conf_ui) => { },
        reset:      () => { },
        set:        (key, value) => { },
        get:        (key) => { },
        setGlobal:  (key, value) => { },
        getGlobal:  (key) => { },
        load:       (file) => { },
        unload:     (file) => { }
      }, require(filepath)));
      {
        if (mod.name == "") {
          log.warn('Blank ' + module_name + ' mod name, will use generated or provided short_name.');
          mod.name = mod.short_name;
        }
        if (mod.version == "") {
          mod.version = pkg.version
        }
        mod.key = module_name + '.' + mod.short_name;

        mod.conf = (obj, conf_ui) => {
          mod.conf_default = Object.assign({}, obj);
          settings.set(mod.key, obj, true);
          mod.conf_ui = conf_ui;
        };
        mod.reset = () => {
          mod.set(mod.conf_default);
        }
        mod.set = (key, value) => {
          let obj = {};
          if (value === undefined) {
            if (typeof key === 'object') {
              obj = key;
            } else { // flag
              value = true;
            }
          } else {
            obj[key] = value;
          }
          settings.set(mod.key, obj);
          mod.emit('conf-set', key, value);
          m.redraw();
        }
        mod.get = (key=null) => {
          return settings.get(mod.key+(key === null ? '' : '.'+key));
        }
        mod.setGlobal = (key, value) => {
          settings.set(key, value);
          m.redraw();
        }
        mod.getGlobal = (key) => {
          return settings.get(key)
        }
        mod.load = (file) => {
          let type = path.extname(file);
          if (type == '.css') {
            let links = document.getElementsByTagName('head')[0].querySelectorAll('link');
            for (let i = 0; i < links.length; i++) {
              if (links[i].getAttribute('href') == file) return;
            }
            let link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('type', 'text/css');
            link.setAttribute('href', file);
            // Redraw UI on load
            link.addEventListener('load', m.redraw);
            document.getElementsByTagName('head')[0].appendChild(link);
          }
        }
        mod.unload = (file) => {
          let type = path.extname(file);
          if (type == '.css') {
            let links = document.getElementsByTagName('head')[0].querySelectorAll('link');
            for (let i = 0; i < links.length; i++) {
              if (links[i].getAttribute('href') == file) {
                links[i].parentNode.removeChild(links[i]);
                return;
              }
            }
          }
        }
        mod.on('redraw', () => {
          m.redraw();
        });
      }
      return mod;
    },
    validate: (pkg, filepath) => {
      // Ensure pack is of the appropriate pack type. First check package.json then try file name match.
      if (!pkg.ome || pkg.ome.packType !== mm.pack_type) {
        let regex = new RegExp('([^-]*)-'+mm.pack_type_short+'-([^-]*)');
        if (!regex.test(path.basename(filepath))) {
          let err = new Error('Incorrect pack type');
          err.code = 'INCORRECT_PACK_TYPE';
          throw err;
        }
      }
    },
    install: files => {
      if (!files || files.length == 0) return;
      let file = files[0];
      // This is kind of nasty.
      DataManager.unpackFileToTemp(file, (err, temp_path) => {
        let restorePreviousPack = ()=>{}
        let temp_pkg = require(path.join(temp_path.fullpath, 'package.json'))

        let match_index = -1
        for (let i = 0; i < mm.packs.length; i++) {
          if (mm.packs[i].short_name == temp_pkg.name) {
            match_index = i
          }
        }

        let placeNewPack = () => {
          DataManager.restoreFromTemp(temp_path.path, path.join('packs', module_name), (err, pack_path) => {
            if (err.length) {
              log.error(err);
              return;
            }
            try {
              mm.load(pack_path);
              log.info("  ...OK");
            } catch (e) {
              // TODO: Show a popup dialog telling the user that the pack could not be installed.
              log.warn("  ...NOKAY");
              log.warn(e);
              fs.remove(pack_path.fullpath, () => {
                restorePreviousPack();
              });
            }
            m.redraw();
          })
        }

        if (match_index == -1) {
          placeNewPack()
        } else {
          DataManager.moveToTemp(path.join('packs', module_name, path.basename(mm.packs[match_index].filepath)), (err, temp_path) => {
            if (err.length) {
              log.error(err);
              return;
            }
            restorePreviousPack = () => {
              DataManager.restoreFromTemp(temp_path.fullpath, path.join('packs', module_name), (err, pack) => {
                if (err.length) {
                  log.error(err);
                  return;
                }
                try {
                  mm.load(pack.filepath);
                  log.info(" ...OK");
                } catch (e) {
                // TODO: Show a popup dialog telling the user that the pack could not be restored.
                  log.warn("  ...NOKAY");
                  log.warn(e);
                }
                m.redraw();
              });
            }
            mm.unload(match_index);
            placeNewPack();
          })
        }
      })
      /*DataManager.unpackFile(file, path.join('packs', module_name), (err, pack_path) => {
        if (err) {
          alert(err);
        } else {
          try {
            mm.load(pack_path);
            log.info("  ...OK");
          } catch (e) {
            log.warn("  ...NOKAY");
            log.warn(e);
          }
          m.redraw();
        }
      });*/
    },
    uninstall: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      DataManager.deleteDirectory(mm.packs[index].filepath, err => {
        if (err) {
          alert(err);
        } else {
          mm.unload(index);
        }
      });
    },
    downloadAndInstall: (downloadURL, attempt) => {
      m.redraw();
      https.get(downloadURL, {
        headers: {
          "User-Agent": "Open Markup Editor"
        }
      }, (res) => {
        if (res.statusCode == 302) {
          if (++attempt > 6) {
            log.error('302 redirects exceeded 6, bailing download.')
            m.redraw();
            return
          }
          if (res.headers.location[0] === '/') {
            downloadURL = url.resolve(downloadURL, res.headers.location)
          } else {
            downloadURL = res.headers.location
          }
          mm.downloadAndInstall(downloadURL, attempt)
          return
        }
        if (res.statusCode !== 200) {
          log.error(res.statusCode, res.statusMessage)
          m.redraw();
          // TODO: show error
          return
        }
        // TODO: update state manager to report downloading status
        // Get our filename, either from content-disposition or from url base name. Should probably add .tar.gz.
        let filename = /filename="*([^"]*)/gi.exec(res.headers['content-disposition'])[1];
        if (!filename) filename = path.basename(downloadURL)
        let output = path.join(app.getPath("temp"), filename)

        // Create file and write it.
        let file = fs.createWriteStream(output)
        res.on('end', () => {
          m.redraw();
          mm.install([output])
        })
        res.pipe(file)
      }).end();
    },
    update: (index, tag, attempt=0) => {
      if (index < 0 || index >= mm.packs.length) return false;
      for (let t in mm.packs[index].updates) {
        let update = mm.packs[index].updates[t]
        if (!update || update.tag_name != tag) continue
        let output = path.join(app.getPath("temp"), update.download.filename)

        mm.packs[index].updating = true
        m.redraw();
        let file = fs.createWriteStream(output)
        https.get(update.download.url, {
          headers: {
            "User-Agent": "Open Markup Editor"
          }
        }, (res) => {
          if (res.statusCode == 302) {
            if (++attempt > 6) {
              log.error('302 redirects exceeded 6, bailing download.')
              mm.packs[index].updating = false
              m.redraw();
              return
            }
            if (res.headers.location[0] === '/') {
              update.download.url = url.resolve(update.download.url, res.headers.location)
            } else {
              update.download.url = res.headers.location
            }

            mm.update(index, tag, attempt)
            return
          }
          if (res.statusCode !== 200) {
            log.error(res.statusCode, res.statusMessage)
            mm.packs[index].updating = false
            m.redraw();
            // TODO: update updates[t] to show error
            return
          }
          res.pipe(file)
          res.on('end', () => {
            mm.packs[index].updating = false
            m.redraw();
            mm.install([output])
          })
        }).end();
        return
      }
    },
    hasRepository: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      if (mm.packs[index].repository == '') return false;
      return true;
    },
    hasUpdate: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      if (mm.packs[index].updates.patch) return true;
      if (mm.packs[index].updates.minor) return true;
      if (mm.packs[index].updates.major) return true;
    },
    isChecking: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      return mm.packs[index].checking;
    },
    isUpdating: index => {
      if (index < 0 || index >= mm.packs.length) return false;
      return mm.packs[index].updating;
    },
    // TODO: Document how to write an update handler.
    updateHandlers: {
      github: {
        getReleasesURL: url => {
          let user = '', repo = '', type = ''
          if (typeof url === 'object') {
            if (url.type != 'git') {
              return ''
            }
            url = url.url
          }
          // Check for NPM-style github declaration first.
          if (url.startsWith('github:')) {
            url = url.substring('github:'.length)
            let parts = url.split('/', 2)
            user = parts[0]
            repo = parts[1]
            type = 'github'
          } else {
            url = new URL(url)
            let pathname = url.pathname
            if (pathname[0] == '/') pathname = pathname.substring(1)
            let parts = pathname.split('/', 2)
            if (url.hostname == 'github.com') {
              type = 'github'
            }
            user = parts[0]
            repo = parts[1].replace(/\.git$/, '') 
          }

          if (type != 'github') return ''
          else return `https://api.github.com/repos/${user}/${repo}/releases`
        },
        checkForUpdate: (pack, target, cb=()=>{}) => {
          https.get(target, {
            json: true,
            headers: {
              "User-Agent": "Open Markup Editor"
            }
          }, (res) => {
            if (res.statusCode !== 200) {
              log.error(res.statusCode, res.statusMessage)
              return
            }
            let str = ''
            res.on('data', chunk => {
              str += chunk
            })
            res.on('end', () => {
              let result = JSON.parse(str)
              // getDownload gets the appropriate download link for the current platform.
              let getDownload = result => {
                let platforms = ['darwin', 'linux', 'win32']
                let generic = -1, platform = -1
                result.assets.forEach((asset, i) => {
                  // Remove extension
                  let basename = path.basename(asset.name, path.extname(asset.name))

                  for (let i = 0; i < platforms.length; i++) {
                    if (basename.endsWith(platforms[i])) {
                      if (platforms[i] == process.platform) {
                        platform = i
                      }
                      return
                    }
                  }
                  generic = i
                })
                let target = platform != -1 ? platform : generic
                if (target != -1) {
                  return {
                    url: result.assets[target].browser_download_url,
                    filename: result.assets[target].name
                  }
                }
                return null
              }
              // Get our major, minor, and/or patch updates available.
              let min_version = semver.clean(pack.version)
              let max_version = semver.inc(min_version, 'major')
              let patch_version = semver.inc(min_version, 'minor')
              let minor_range = `>${min_version} <${max_version}`
              let patch_range = `>${min_version} <${patch_version}`
              for (let i = 0; i < result.length; i++) {
                let tag_name = semver.clean(result[i].tag_name)
                // Is a patch
                if (semver.satisfies(tag_name, patch_range)) {
                  if (!pack.updates.patch || semver.gt(tag_name, semver.clean(pack.updates.patch.tag_name))) {
                    pack.updates.patch = {
                      tag_name: result[i].tag_name,
                      text: result[i].body,
                      download: getDownload(result[i])
                    }
                  }
                }
                // Is a minor update
                if (semver.satisfies(tag_name, minor_range)) {
                  if (!pack.updates.minor || semver.gt(tag_name, semver.clean(pack.updates.minor.tag_name))) {
                    pack.updates.minor = {
                      tag_name: result[i].tag_name,
                      text: result[i].body,
                      download: getDownload(result[i])
                    }
                  }
                }
                // Is a major update
                if (semver.gtr(tag_name, minor_range)) {
                  if (!pack.updates.major || semver.gt(tag_name, semver.clean(pack.updates.major.tag_name))) {
                    pack.updates.major = {
                      tag_name: result[i].tag_name,
                      text: result[i].body,
                      download: getDownload(result[i])
                    }
                  }
                }
              }
              if (pack.updates.major || pack.updates.minor || pack.updates.patch) {
                cb(true)
              } else {
                cb(false)
              }
            })
          }).end();
        }
      },
      gitea: {
        getReleasesURL: url => {
          let user = '', repo = ''
          if (typeof url === 'object') {
            if (url.type != 'git') {
              return ''
            }
            url = url.url
          }

          url = new URL(url)
          let pathname = url.pathname
          if (pathname[0] == '/') pathname = pathname.substring(1)
          let parts = pathname.split('/', 2)

          user = parts[0]
          repo = parts[1].replace(/\.git$/, '') 

          if (user == '' || repo == '') return ''
          else return `${url.protocol}//${url.host}/api/v1/repos/${user}/${repo}/releases`
        },
        checkForUpdate: (pack, target, cb=()=>{}) => {
          return mm.updateHandlers.github.checkForUpdate(pack, target, cb)
        }
      }
    },
    checkForUpdate: (index, cb=()=>{}) => {
      if (index < 0 || index >= mm.packs.length) return false;
      // NOTE: We are presuming that Chromium iterates object properties in a FIFO order.
      for (let handler in mm.updateHandlers) {
        if (!mm.packs[index].repository) continue
        mm.packs[index].checking = true
        let url = mm.updateHandlers[handler].getReleasesURL(mm.packs[index].repository)
        if (url) {
          mm.updateHandlers[handler].checkForUpdate(mm.packs[index], url, (hasUpdate) => {
            mm.packs[index].checking = false
            cb(hasUpdate)
          })
          return
        }
      }
      cb(false)
    },
  }, obj));
  return mm;
}

module.exports = makePackManager;
