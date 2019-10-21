let m = require('mithril');
let settings = require('electron-app-settings');

let Files = require('../models/Files');

module.exports = {
  view: (vnode) => {
    return (
      m("section.welcome",
        m('section.welcome-text', 
          m("div", "Hello!"),
          m("div", "Create or Open a markup file of your delicious flavour!")
        ),
        m("section.recent-files",
          m("header", "Recent Files"),
          m('article.recent-files__items', 
            settings.get('recent_files').map((el) => {
              return m('.recent-files__item', {
                onclick: () => {
                  Files.loadFile(el.filepath);
                }
              }, [
                m('.recent-files__item__name', el.name),
                m('.recent-files__item__filepath', el.filepath),
              ])
            })
          )
        )
      )
    );
  }
}
