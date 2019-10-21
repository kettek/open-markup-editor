let m = require('mithril');

const { ipcRenderer } = require('electron');

let AboutView = require('./js/views/About');

m.route(document.body, "/", {
  "/": AboutView
})

document.addEventListener('keyup', (e) => {
  if (e.key == "Escape") {
    ipcRenderer.send('about-hide');
  }
});

document.addEventListener('click', () => {
  ipcRenderer.send('about-hide');
});