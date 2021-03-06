let m = require('mithril');
let settings = require('electron-app-settings');

let MarkupPackManager = require('../MarkupPackManager');
let Files = require('../models/Files');

module.exports = {
  view: (vnode) => {
    return (
      m("section.welcome",
        m('section.welcome-text', 
          m("header", "Hello!"),
          m("div", 
            m('span', "Create or open "),
            Object.keys(MarkupPackManager.getSupportedExtensions()).map((extensionGroupKey, index, src) => {
              return [
                m('span', (index > 0 ? index == src.length-1 ? ', or ' : ', ' : '')),
                m('span.extension', extensionGroupKey),
              ]
            }),
            m('span', ' files!')
          ),
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
