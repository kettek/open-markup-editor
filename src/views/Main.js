let m = require('mithril');

let Files = require('../models/Files');

let ViewWindow = require('./ViewWindow');
let TabsView = require('./Tabs');
let TabView = require('./Tab');
let FooterView = require('./Footer');
let WelcomeView = require('./Welcome');
let SettingsView = require('./Settings')

const UIState = require('../UIState');

module.exports = {
  oninit: (vnode) => {
  },
  view: () => {
    const view = [];
    view.push( m(TabsView, 
        Files.loadedFiles.map(function(file, index) {
          return m(TabView, {fileIndex: index});
        })
      ));
    if (Files.loadedFiles.length == 0) {
      view.push(m('section.main', m(WelcomeView), (UIState.show_config ? m(SettingsView) : null )));
    } else {
      view.push(m('section.main',
        m(ViewWindow, {fileIndex: Files.focused}),
        (UIState.show_config ? m(SettingsView) : null)
      ));
    }
    view.push(m(FooterView, {fileIndex: Files.focused}));
    return view;
  }
}
