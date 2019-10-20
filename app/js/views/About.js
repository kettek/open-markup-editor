let m = require('mithril');

const { ipcRenderer, shell } = require('electron');

const pkg = require('../../../package.json')

let state = {
  bsList: ['💩','👽','💀','🤬','🦵','🧠','🦶','🌯','🥦','🥚','🍚','☕️','🗿','🦖','🔪','⚰️','⌨️','💻','🖥','⁉️','💤','🎵','🗯','🐱','🧂'],
  bs: 0,
}

module.exports = {
  oninit: (vnode) => {
  },
  view: () => {
    return [
      m('header', [
        m('div#name', pkg.productName),
        m('div#version', pkg.version),
      ]),
      m('#content', [
        m('#owl-image')
      ]),
      m('footer',
        m('span#bs', [
          'Made with ',
          state.bsList[state.bs],
          ' by ',
          m('a', {
            onclick: () => {
              shell.openExternal('https://kettek.net');
            }
          }, 'Ketchetwahmeegwun T. Southall'),
          '.'
        ])
      )
    ]
  }
}

ipcRenderer.on('about-show', (event, arg) => {
  state.bs = new Date % state.bsList.length
  m.redraw();
});