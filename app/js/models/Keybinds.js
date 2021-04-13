const m       = require('mithril');
const Emitter = require('../emitter');

/**
 * Keybinds is a simple keybind system that maps keys to bind names and
 * bind names to callbacks. Callbacks are optional and all triggered binds
 * will cause a trigger event to be emitted.
 */
let Keybinds = Emitter({
  keymap: {}, // Key => Bind
  binds: {},
  addBind: (name, key, cb) => {
    if (!Keybinds.keymap[key]) {
      Keybinds.keymap[key] = []
    }
    if (!Keybinds.binds[name]) {
      Keybinds.binds[name] = []
    }
    if (Keybinds.keymap[key].indexOf(name) !== -1) {
      return
    }
    Keybinds.keymap[key].push(name)
    if (cb) {
      Keybinds.binds[name].push(cb)
    }
  },
  removeBind: (name, key, cb) => {
    if (!Keybinds.keymap[key]) {
      return
    }
    let matchIndex = Keybinds.keymap[key].indexOf(name)
    if (matchIndex !== -1) {
      Keybinds.keymap[key].splice(matchIndex, 1)
    }
    if (Keybinds.binds[name] && cb) {
      let cbIndex = Keybinds.binds[name].indexOf(cb)
      if (cbIndex !== -1) {
        Keybinds.binds[name].splice(cbIndex, 1)
      }
      if (Keybinds.binds[name].length === 0) {
        delete Keybinds.binds[name]
      }
    }
  },
  init: () => {
    window.addEventListener('keyup', Keybinds.onKeyup)
  },
  onKeyup: e => {
    if (Keybinds.keymap[e.code]) {
      for (let name of Keybinds.keymap[e.code]) {
        if (Keybinds.binds[name]) {
          for (let cb of Keybinds.binds[name]) {
            cb(name, e)
          }
        }
        Keybinds.emit('trigger', name, e)
        // I suppose it's sane enough to emit a redraw when a keybind has been triggered.
        m.redraw()
      }
    }
  },
  deinit: () => {
    window.removeEventListener('keyup', Keybinds.onKeyup)
  },
});

module.exports = Keybinds;
