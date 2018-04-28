let m = require('mithril');

let Files = require('../models/Files');

let ViewWindow = require('./ViewWindow');
let TabsView = require('./Tabs');
let TabView = require('./Tab');
let FooterView = require('./Footer');
let WelcomeView = require('./Welcome');

module.exports = {
  oninit: (vnode) => {
  },
  view: () => {
    if (Files.loadedFiles.length == 0) {
      return m(WelcomeView);
    } else {
      return [
        m(TabsView, 
          Files.loadedFiles.map(function(file, index) {
            return m(TabView, {fileIndex: index});
          })
        ),
        m(ViewWindow, {fileIndex: Files.focused}),
        m(FooterView, {fileIndex: Files.focused})
      ];
    }
  }
}
