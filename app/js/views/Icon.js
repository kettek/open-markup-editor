let m = require('mithril');

module.exports = {
  view: (vnode) => {
    return m('svg', Object.assign({
        className: vnode.attrs.className,
        id: vnode.attrs.id,
      }, vnode.attrs.attrs),
      m('use', {
        href: './icons.svg#' + vnode.attrs.iconName
      })
    )
  }
}
