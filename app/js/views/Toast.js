const m        = require('mithril');
let Icon       = require('./Icon')

module.exports = {
  view: vnode => {
    return m('article'+(vnode.attrs.type?'.-'+vnode.attrs.type:''),
    [
      m('aside.toaster__toast__icon', [
        m(Icon, {
          iconName: vnode.attrs.type,
          className: '-'+vnode.attrs.type,
        }, '')
      ]),
      m('header.toaster__toast__title', vnode.attrs.title),
      m('header.toaster__toast__subtitle', vnode.attrs.timestamp.toString()),
      m('main.toaster__toast__body', vnode.attrs.body),
      m('aside.toaster__toast__controls', [
        m('header.toaster__toast__controls__nav', [
          m('span.toaster__toast__controls__nav__count', [
            m('span', vnode.attrs.currentIndex+1),
            m('span', '/'),
            m('span', vnode.attrs.toastCount),
          ]),
          m('span', [
            m(Icon, {
              iconName: "arrow-up",
              className: "navIcon -left" + (!vnode.attrs.hasPrev?' -disabled':''),
              attrs: {
                onclick: () => {
                  vnode.attrs.onnav(-1)
                }
              }
            }, ''),
            m(Icon, {
              iconName: "arrow-up",
              className: "navIcon -right" + (!vnode.attrs.hasNext?' -disabled':''),
              attrs: {
                onclick: () => {
                  vnode.attrs.onnav(1)
                }
              }
            }, '')
          ])
        ]),
        m('main.toaster__toast__controls__close', [
          m(Icon, {
            iconName: "remove",
            className: "closeToast",
            attrs: {
              onclick: () => {
                vnode.attrs.onclose()
              }
            }
          }, '')
        ]),
      ])
    ])
  },
}