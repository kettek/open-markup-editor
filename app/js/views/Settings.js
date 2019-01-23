const m = require('mithril');
const {dialog} = require('electron').remote;
const settings = require('electron-app-settings');

const AppState = require('../models/AppState');
let Files = require('../models/Files');
let EditorPackManager = require('../EditorPackManager');
let MarkupPackManager = require('../MarkupPackManager');
let RenderPackManager = require('../RenderPackManager');
let ExtensionPackManager = require('../ExtensionPackManager');

let ListBuilder = require('./ListBuilder');

const defined_elements = {
  'section': {
    tag: 'section',
  },
  'article': {
    tag: 'article',
    value: '<h1>%VALUE%</h1>'
  },
  'checkbox': {
    tag: 'input[type=%TYPE%]',
    events: ['change'],
    map: {
      key: 'id',
      value: 'checked'
    }
  },
  'select': {
    tag: 'select',
    map: {
      key: 'id',
      value: 'selectedIndex'
    }
  },
  'option': {
    tag: 'option'
  },
  'listbuilder': {
    mithril: ListBuilder,
    map: {
      items: 'left_items',
      selected_items: 'right_items'
    }
  },
  'input': {
    tag: 'input[type=text]',
    events: ['change'],
    map: {
      key: 'id',
      value: 'value'
    }
  },
  'number': {
    tag: 'input[size=5][type=number]',
    events: ['change'],
    map: {
      key: 'id',
      value: 'value'
    }
  },
  'hex': {
    tag: 'input[size=5][type=text]',
    events: ['change'],
    map: {
      key: 'id',
      value: 'value'
    }
  },
  'color': {
    tag: 'input[type=%TYPE%]',
    events: ['change'],
    map: {
      key: 'id',
      value: 'value'
    }
  },
  'label': {
    map: {
      key: 'for'
    }
  }
};

function build(extension, obj) {
  let item = {
    tag: '',
    key: '',
    value: undefined,
    attrs: {},
    children: [],
    classes: [],
    id: ''
  };

  if (Array.isArray(obj)) {
    // OH, we're a declaration!
    for (let i = 0; i < obj.length; i++) {
      if (Array.isArray(obj[i])) {
        item.children.push(build(extension, obj[i]));
      } else if (typeof obj[i] === 'function') {
        item.children.push(build(extension, obj[i]()));
      } else if (typeof obj[i] === 'object') {
        item.attrs = Object.assign(item.attrs, obj[i]);
      } else { // Strings, Booleans, etc.
        if (i === 0) { // Type
          item.tag = obj[i];
        } else if (i === 1) { // Contents
          item.value = obj[i];
        } else if (i === 2) { // Key
          item.key = obj[i];
        }
      }
    }
    // Parse out classname and id from tag
    let reg = /([\.|#][a-zA-Z0-9_-]*)/g
    let part;
    while ((part = reg.exec(item.tag)) != null) {
      if (part[0][0] == '.') {
        item.classes.push(item.tag.substr(part.index+1, part[0].length-1));
      } else if (part[0][0] == '#') {
        item.id = item.tag.substr(part.index+1, part[0].length-1);
      }
      item.tag = item.tag.substr(0, part.index);
    }

    // Apply element filter
    let e_handler = defined_elements[item.tag];
    if (e_handler) {
      if (e_handler.map) {
        if (item.key && e_handler.map.key) {
          item.attrs[e_handler.map.key] = extension.short_name+'_'+item.key;
          if (e_handler.map.value) {
            let stored_value = extension.get(item.key);
            if (stored_value) item.value = stored_value;
          }
          item.attrs[e_handler.map.key] = extension.short_name+'_'+item.key;
        }
        if (item.value !== undefined && e_handler.map.value) {
          item.attrs[e_handler.map.value] = item.value;
        }
        for (let i = 0; e_handler.events && i < e_handler.events.length; i++) {
          item.attrs['on'+e_handler.events[i]] = (e) => {
            extension.set(item.key, e.target[e_handler.map.value]);
          }
        }
      }
      if (item.tag && e_handler.tag) {
        item.tag = e_handler.tag.replace('%TYPE%', item.tag);
      }
      if (item.value !== undefined && e_handler.value) {
        item.value = e_handler.value.replace('%VALUE%', item.value);
        item.children.unshift(m.trust(item.value));
        item.value = '';
      }
    }
    // Process attrs that are functions
    Object.keys(item.attrs).forEach((key, index) => {
      if (typeof item.attrs[key] === 'function' && !key.startsWith("on")) {
        item.attrs[key] = item.attrs[key]();
      }
    });

    // If the tag is still blank, then we presume it is simply a container unworthy of _THE DOM_.
    if (item.tag == '') {
      return item.children;
    } else {
      if (e_handler && e_handler.mithril) {
        return m(e_handler.mithril, Object.assign({
          id: item.id,
          className: item.classes.join('.'),
        }, item.attrs), item.attrs, item.value, item.children);
      }
      return m(item.tag + (item.classes ? '.'+item.classes.join('.') : '') + (item.id ? '#'+item.id : ''), item.attrs, item.value, item.children);
    }
  }
}

module.exports = {
  oncreate: (vnode) => {
    AppState.NewTimingFunction('settings-open', (completed) => {
      vnode.dom.style.left = 100 - (completed) + '%'
    }, 500);
  },
  onbeforeremove: (vnode) => {
    return new Promise((resolve) => {
      AppState.NewTimingFunction('settings-close', (completed) => {
        if (completed == 100) {
          resolve();
        }
        vnode.dom.style.left = completed + '%'
      }, 500);
    });
  },
  view: (vnode) => {
    return(
      m("section.settings",
        // Editor Packs
        m("header", "Editor Packs", m("button.new", {
          onclick: () => {
            dialog.showOpenDialog({
              title: "Install Editor Pack archive",
              filters: [{name: 'Tarballs', extensions: ["tar", "tar.gz", "tgz"]}],
              properties: ["openFile", "showHiddenFiles"]
            }, EditorPackManager.install);
          }
        }) ),
        EditorPackManager.packs.map((pack, index) => {
          return build(pack, [
            'article', ['header', pack.name, ['button.disabled', 'Not Yet Implemented', {onclick: () => {}}]], pack.conf_ui]);
        }),
        // Markup Packs
        m("header", "Markup Packs", m("button.new", {
          onclick: () => {
            dialog.showOpenDialog({
              title: "Install Editor Pack archive",
              filters: [{name: 'Tarballs', extensions: ["tar", "tar.gz", "tgz"]}],
              properties: ["openFile", "showHiddenFiles"]
            }, EditorPackManager.install);
          }
        }) ),
        MarkupPackManager.packs.map((pack, index) => {
          return build(pack, [
            'article', ['header', pack.name, ['button.disabled', 'Not Yet Implemented', {onclick: () => {}}]], pack.conf_ui
          ]);
        }),
        // Render Packs
        m("header", "Render Packs", m("button.new", {
          onclick: () => {
            dialog.showOpenDialog({
              title: "Install Render Pack archive",
              filters: [{name: 'Tarballs', extensions: ["tar", "tar.gz", "tgz"]}],
              properties: ["openFile", "showHiddenFiles"]
            }, RenderPackManager.install);
          }
        })),
        RenderPackManager.packs.map((pack, index) => {
          return build(pack, [
            'article', ['header', pack.name, 
            (pack.read_only
              ? ['button.disabled', 'Built-in']
              : ['button', 'Uninstall', {
                onclick: () => {
                  RenderPackManager.uninstall(index);
                }
              }]
            )
            ],
            pack.enabled ? pack.conf_ui.concat([['button.reset', 'Reset to Defaults', {onclick: pack.reset}]]) : null
          ]);
        }),
        // ExtensionPackManager
        m("header", "Extensions", m("button.new", {
          onclick: () => {
            dialog.showOpenDialog({
              title: "Install Render Pack archive",
              filters: [{name: 'Tarballs', extensions: ["tar", "tar.gz", "tgz"]}],
              properties: ["openFile", "showHiddenFiles"]
            }, RenderPackManager.install);
          }
        })),
        ExtensionPackManager.packs.map((extension, index) => {
          return build(extension, [
            'article', ['header', extension.name, ['button.' + (extension.enabled ? 'disable' : 'enable'), extension.enabled ? 'Disable' : 'Enable', {onclick: () => ExtensionPackManager.toggle(index)}]], extension.enabled ? extension.conf_ui.concat([['button.reset', 'Reset to Defaults', {onclick: extension.reset}]]) : null
          ]);
        })
      )
    )
  }
}
