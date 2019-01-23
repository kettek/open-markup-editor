let m = require('mithril');
const AppState = require('../models/AppState')

const settings = require('electron-app-settings');

let storeElementSettings = (e, v) => {
  // NOTE: electron-settings is foolish and does not escape dot-syntax, e.g., `my\.one\.object` turns into `"my\":{"one\": {"object": ... } }` instead of `"my\.one\.object": ..., so we are just going with the foolish flow here.
  let identifier = e.tagName + (e.className ? '\\.'+e.className : '') + (e.id ? '#' + e.id : '');

  let iterate = (ectx, value) => {
    if (!ectx) return;
    let obj = {};
    if (typeof value === "string") {
      obj[value] = ectx[value];
    } else if (value instanceof Object) {
      for (v in value) {
        obj[v] = iterate(ectx[v], value[v]);
      }
    }
    return obj;
  }
  settings.set('element_settings.'+identifier, iterate(e, v));
}

module.exports = {
  view: (vnode) => {
    return m('.splitter', {
      onmousedown: (e) => {
        const addEvents = () => {
          document.addEventListener('mouseout', vnode.state.mouseout);
          window.addEventListener('mouseup', vnode.state.mouseup);
          window.addEventListener('mousemove', vnode.state.mousemove);
        }
        const removeEvents = () => {
          window.removeEventListener('mouseup', vnode.state.mouseup);
          document.removeEventListener('mouseout', vnode.state.mouseout);
          window.removeEventListener('mousemove', vnode.state.mousemove);
          // Store elements on close
          let e1 = vnode.dom.previousSibling,
              e2 = vnode.dom.nextSibling;
          if (!e1 || !e2) return;
          storeElementSettings(e1, {style: 'flex'});
          storeElementSettings(e2, {style: 'flex'});
          AppState.emit('splitter-move');
        }
        vnode.state.mousemove = e => {
          let e1 = vnode.dom.previousSibling,
              e2 = vnode.dom.nextSibling;
          if (!e1 || !e2) return;
          let x = e.clientX;
          let w1 = e1.offsetWidth,
              w2 = e2.offsetWidth,
              w  = w1 + w2;
          let l = x,
              r = w - x;
          let fl = w/l,
              fr = w/r;

          e1.style.flex = fr;
          e2.style.flex = fl;

          // TODO: make this emit the elements as well.
          AppState.emit('splitter-move');

          e.stopPropagation();
          e.preventDefault();
        }
        vnode.state.mouseout = e => {
          if (e.target !== document) return;
          removeEvents();
        }
        vnode.state.mouseup = e => {
          removeEvents();
        }
        addEvents();
        e.stopPropagation();
      }
    });
  }
}
