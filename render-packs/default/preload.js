const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('webview-disable-external-navigation', true);
  window.onbeforeunload = () => {
    ipcRenderer.send('webview-disable-external-navigation', false);
  }

  const target_element = document.getElementById('OME_TARGET');
  ipcRenderer.on('render', (event, message) => {
    target_element.innerHTML = message;
  });
  ipcRenderer.on('line', (event, message) => {
    let el = document.querySelector('[data-source-line="'+message+'"]');
    if (el) {
      el.scrollIntoView();
    }
  });
});
