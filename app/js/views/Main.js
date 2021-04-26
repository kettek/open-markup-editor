let m = require('mithril');

let Files = require('../models/Files');

let ViewWindow = require('./ViewWindow');
let TabsView = require('./Tabs');
let TabView = require('./Tab');
let FooterView = require('./Footer');
let WelcomeView = require('./Welcome');
let SettingsView = require('./Settings');
let ToasterReplicatorView = require('./ToasterReplicator');

let AppState = require('../models/AppState');
let Keybinds = require('../models/Keybinds');

module.exports = {
  oninit: (vnode) => {
    Keybinds.init();
  },
  onbeforeremove: (vnode) => {
    Keybinds.deinit();
  },
  view: () => {
    const view = [];
    view.push( m(TabsView, 
        Files.loadedFiles.map(function(file, index) {
          return m(TabView, {fileIndex: index});
        })
      ));
    if (Files.loadedFiles.length == 0) {
      view.push(m('section.main', m(WelcomeView), (AppState.show_config ? m(SettingsView) : null )));
    } else {
      view.push(m('section.main',
        m(ViewWindow, {fileIndex: Files.focused}),
        (AppState.show_config ? m(SettingsView) : null)
      ));
    }
    view.push(m(FooterView, {fileIndex: Files.focused}));
    view.push(m(ToasterReplicatorView));
    return view;
  }
}
