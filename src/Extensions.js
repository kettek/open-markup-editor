const Emitter = require('./emitter');
const Config = require('./models/Config');
const fs      = require('fs');
const path    = require('path');

const Extensions = {
  list: [],
  populateExtensionsList: (dir, on_finish=()=>{}) => {
    fs.readdir(dir, (err, files) => {
      files.forEach(file => {
        try {
          Extensions.loadExtension(path.join(dir, file));
        } catch (e) {
          console.log("Failed to load extension \"" + file + "\"");
        }
      });
      on_finish();
    });
  },
  getExtensionIndexByShortName: short_name => {
    return Extensions.list.filter(extension => {return extension.short_name == short_name});
  },
  loadExtension: filepath => {
    try {
      let extension = Emitter(require(filepath));
      extension.did_setup = false;
      extension.short_name = extension.short_name || path.basename(filepath);
      if (!extension.name) {
        console.log('Warning, no extension name provided, will use generated or provided short_name.');
        extension.name = extension.short_name;
      }
      if (!extension.setup) {
        console.log("Warning, no extension setup provided. I hope you know what you're doing.");
        extension.setup = ()=>{};
      }
      extension.conf = (obj) => {
        Config.set('extensions.'+extension.short_name, obj, true);
      }
      extension.getConf = (key=null) => {
        return Config.get('extensions.'+extension.short_name+(key === null ? '' : '.'+key));
      }
      Extensions.list.push(extension);
    } catch (e) {
      // TODO: complain
      throw e;
    }
  },
  setupExtension: index => {
    let extension = Extensions.list[index];
    if (extension.did_setup) return;
    extension.setup(extension);
    extension.did_setup = true;
  },
  enableExtension: index => {
    if (index < 0 || index >= Extensions.list.length) return;
    if (Extensions.list[index].enabled) return;
    // Setup if it hasn't been done already
    Extensions.setupExtension(index);
    // Enable that beezy
    Extensions.list[index].enabled = Extensions.list[index].emit('enable') === false ? false : true;
  },
  disableExtension: index => {
    if (index < 0 || index >= Extensions.list.length) return;
    if (!Extensions.list[index].enabled) return;
    Extensions.list[index].enabled = Extensions.list[index].emit('disable') === false ? true : false;
  }
};

module.exports = Extensions;
