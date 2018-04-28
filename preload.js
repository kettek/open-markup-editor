const { ipcRenderer, remote } = require('electron');
const Files       = require('./src/models/Files');
const RenderPacks = remote.require('./src/models/RenderPacks');

const url = require('url');
const path = require('path');

let rp = RenderPacks.getPack(Files.getFileExtension(Files.focused));

window.ome = {};
window.ome.on = (name, cb) => {
  window.ome.on[name] = window.ome.on[name] || [];
  window.ome.on[name].push(cb);
};
window.ome.emit = (name, data) => {
  for (let cb of window.ome.on[name]) {
    cb(data);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('webview-disable-external-navigation', true);
  window.onbeforeunload = () => {
    ipcRenderer.send('webview-disable-external-navigation', false);
  }

  let filepath = '', filename = '';

  ipcRenderer.on('filepath', (event, message) => {
    filepath = message;
    window.ome.emit('filepath', filepath);
  });
  ipcRenderer.on('filename', (event, message) => {
    filename = message;
    window.ome.emit('filename', message);
  });

  ipcRenderer.on('render', (event, message) => {
    window.ome.emit('render', message);
    // Iterate through all elements with src and href, changing their src/href to point to the absolute directory relative to the file's path.
    // NOTE: This seems very inefficient and silly. It would be nicer to implement a higher-level request proxy system, if possible.
    let src_list = document.body.querySelectorAll('[src],[href]');
    var r = new RegExp('^(?:[a-z]+:)?//', 'i');
    for (let i = 0; i < src_list.length; ++i) {
      let item = src_list[i];
      // TODO: Many MD->HTML systems use a path relative to the markdown file ("page.md" -> "image.png"), not ("page.md" -> "page/image.png"), so there should be a configuration flag for that.
      if (item.hasAttribute('href')) {
        let href = item.getAttribute('href');
        if (r.test(href) == false) {
          item.setAttribute('href', path.join(path.dirname(filepath), path.basename(filepath, path.extname(filepath)), href));
        }
      }
      if (item.hasAttribute('src')) {
        let src = item.getAttribute('src');
        if (r.test(src) == false) {
          item.setAttribute('src', path.join(path.dirname(filepath), path.basename(filepath, path.extname(filepath)), src));
        }
      }
    }
  });
  ipcRenderer.on('line', (event, message) => {
    window.ome.emit('line', message);
  });
  window.dispatchEvent(new Event('ome-ready'));
  window.ome.emit('ready');
});

if (rp.preload) {
  require(rp.preload);
}
