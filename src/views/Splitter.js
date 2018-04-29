let m = require('mithril');

const Config = require('../models/Config.js');

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
          Config.storeElementSettings(e1, {style: 'flex'});
          Config.storeElementSettings(e2, {style: 'flex'});
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
