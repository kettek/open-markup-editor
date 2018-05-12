const m = require('mithril');
const settings = require('electron-app-settings');

let Files = require('../models/Files');
let EditorPacks = require('../models/EditorPacks');
let MarkupPacks = require('../models/MarkupPacks');
let RenderPacks = require('../models/RenderPacks');
let Extensions = require('../Extensions');

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
  'input': {
    tag: 'input',
    events: ['change'],
    map: {
      key: 'id',
      value: 'value'
    }
  },
  'hex': {
    tag: 'input[size=5]',
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
            let stored_value = extension.getConf(item.key);
            if (stored_value) item.value = stored_value;
          }
          item.attrs[e_handler.map.key] = extension.short_name+'_'+item.key;
        }
        if (item.value !== undefined && e_handler.map.value) {
          item.attrs[e_handler.map.value] = item.value;
        }
        for (let i = 0; e_handler.events && i < e_handler.events.length; i++) {
          item.attrs['on'+e_handler.events[i]] = (e) => {
            extension.setConf(item.key, e.target[e_handler.map.value]);
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
      return m(item.tag + (item.classes ? '.'+item.classes.join('.') : '') + (item.id ? '#'+item.id : ''), item.attrs, item.value, item.children);
    }
  }
}

module.exports = {
  onbeforeremove: (vnode) => {
    vnode.dom.style.animation = '';
    vnode.dom.classList.add("closeElement");
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  },
  view: (vnode) => {
    return(
      m("section.settings",
        // Markup Packs
        /*m("header", "Markup Packs"),
        m("select", {size: MarkupPacks.packs.length},
          MarkupPacks.packs.map((pack) => {
            return m('option', pack.name);
          }),
        ),*/
        // Editor Packs
        m("header", "Editor Packs"),
        EditorPacks.packs.map((pack, index) => {
          return build(pack, [
            'article', ['header', pack.name, ['button.disabled', 'Not Yet Implemented', {onclick: () => {}}]], pack.conf_ui]);
        }),
        // Render Packs
        m("header", "Render Packs"),
        RenderPacks.packs.map((pack, index) => {
          return build(pack, [
            'article.disabled', ['header', pack.name, ['button.' + (pack.enabled ? 'disable' : 'enable'), pack.enabled ? 'Disable' : 'Not Yet Implemented', {onclick: () => {}}]], pack.enabled ? pack.conf_ui.concat([['button.reset', 'Reset to Defaults', {onclick: pack.reset}]]) : null
          ]);
        }),
        // Extensions
        m("header", "Extensions"),
        Extensions.list.map((extension, index) => {
          return build(extension, [
            'article', ['header', extension.name, ['button.' + (extension.enabled ? 'disable' : 'enable'), extension.enabled ? 'Disable' : 'Enable', {onclick: () => Extensions.toggleExtension(index)}]], extension.enabled ? extension.conf_ui.concat([['button.reset', 'Reset to Defaults', {onclick: extension.reset}]]) : null
          ]);
        })
      )
    )
  }
}
