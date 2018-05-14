const m = require('mithril');

const ListBuilder = {
  oninit: vnode => {
    vnode.state.left_items = vnode.attrs.left_items;
    vnode.state.right_items = vnode.attrs.right_items;
    vnode.state.left_index = 0;
    vnode.state.right_index = 0;
  },
  view: vnode => {
    return [
      m('select', {
        onchange: e => {
          vnode.state.left_index = e.target.selectedIndex;
        },
        size: vnode.state.left_items.length + vnode.state.right_items.length
      }, vnode.state.left_items.map((item, index) => {
        if (vnode.state.right_items.indexOf(item) == -1) {
          return m('option', {
            selected: index == vnode.state.left_index
          }, item);
        }
      })),
      m('.controls', [
        m('button.add', {
          onclick: () => {
            if (vnode.state.left_items.length == 0) return;
            vnode.state.right_items.push(vnode.state.left_items.splice(vnode.state.left_index, 1)[0]);
            if (vnode.state.left_index >= vnode.state.left_items.length) vnode.state.left_index = vnode.state.left_items.length-1;
            if (vnode.attrs.onchange) vnode.attrs.onchange(vnode.state);
            m.redraw();
          }
        }, ">"),
        m('button.remove', {
          onclick: () => {
            if (vnode.state.right_items.length == 0) return;
            vnode.state.left_items.push(vnode.state.right_items.splice(vnode.state.right_index, 1)[0]);
            if (vnode.state.right_index >= vnode.state.right_items.length) vnode.state.right_index = vnode.state.right_items.length-1;
            if (vnode.attrs.onchange) vnode.attrs.onchange(vnode.state);
            m.redraw();
          }
        }, "<")
      ]),
      m('select', {
        onchange: e => {
          vnode.state.right_index = e.target.selectedIndex;
        },
        size: vnode.state.left_items.length + vnode.state.right_items.length
      }, vnode.state.right_items.map((item, index) => {
        return m('option', {
          selected: index == vnode.state.right_index
        }, item);
      }))
    ]
  }
};

module.exports = ListBuilder;
