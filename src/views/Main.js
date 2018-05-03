let m = require('mithril');

let Files = require('../models/Files');

let ViewWindow = require('./ViewWindow');
let TabsView = require('./Tabs');
let TabView = require('./Tab');
let FooterView = require('./Footer');
let WelcomeView = require('./Welcome');
let SettingsView = require('./Settings');

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
      //view.push(m(SettingsView));
      view.push(m(WelcomeView));
    } else {
      view.push(m(ViewWindow, {fileIndex: Files.focused}));
      view.push(m(FooterView, {fileIndex: Files.focused}));
    }
    return view;
  }
}
