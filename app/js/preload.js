const { ipcRenderer } = require('electron');
const Emitter = require('./emitter.js');

const url = require('url');
const path = require('path');

window.ome = Emitter();

window.ome.getLink = (name) => {
  let links = document.head.getElementsByTagName('link');
  for (let link of links) {
    if (link.getAttribute('href') === name) {
      return link;
    }
  }
};

window.ome.addLink = (name) => {
  let link = window.ome.getLink(name);
  if (link) return;
  link = document.createElement('link');
  if (name.endsWith('.css')) {
    link.rel = 'stylesheet';
  }
  link.href = name;
  document.head.appendChild(link);
};
window.ome.removeLink = (name) => {
  let link = window.ome.getLink(name);
  if (!link) return;
  link.parentNode.removeChild(link);
};

document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.on('go', (event, rp) => {
    if (rp.preload) {
      require(rp.preload);
    }
    /*ipcRenderer.send('webview-disable-external-navigation', true);
    window.onbeforeunload = () => {
      ipcRenderer.send('webview-disable-external-navigation', false);
    }*/
  
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
      // Store and restore scroll positions
      let x = window.scrollX, y = window.scrollY;
      window.ome.emit('render', message);
      window.scroll(x,y);
    });
    ipcRenderer.on('line', (event, message) => {
      window.ome.emit('line', message);
    });

    // Send config information from render-pack.
    ipcRenderer.on('conf', (event, message) => {
      window.ome.emit('conf', message);
    });
    ipcRenderer.on('conf-set', (event, message) => {
      window.ome.emit('conf-set', message);
    });

    window.dispatchEvent(new Event('ome-ready'));
    window.ome.emit('ready');
  });
});

