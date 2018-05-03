let m = require('mithril');

let Files = require('../models/Files');
let Config = require('../models/Config');
let Extensions = require('../Extensions');

const defined_elements = {
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
    tag: 'section',
    key: '',
    value: '',
    attrs: {},
    children: []
  };

  if (Array.isArray(obj)) {
    // OH, we're a declaration!
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        if (i === 0) { // Type
          item.tag = obj[i];
        } else if (i === 1) { // Contents
          item.value = obj[i];
        } else if (i === 2) { // Key
          item.key = obj[i];
        }
      } else if (Array.isArray(obj[i])) {
        item.children.push(build(extension, obj[i]));
      } else if (typeof obj[i] === 'object') {
        item.attrs = Object.assign(item.attrs, obj[i]);
      }
    }

    // Apply element filter
    let e_handler = defined_elements[item.tag];
    if (e_handler) {
      if (e_handler.map) {
        if (item.key && e_handler.map.key) {
          item.attrs[e_handler.map.key] = extension.short_name+'_'+item.key;
          if (e_handler.map.value) {
            let stored_value = Config.get('extensions.' + item.attrs[e_handler.map.key].replace('_','.'));
            if (stored_value) item.value = stored_value;
          }
        }
        if (item.value && e_handler.map.value) {
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
      if (item.value && e_handler.value) {
        item.value = e_handler.value.replace('%VALUE%', item.value);
        item.children.unshift(m.trust(item.value));
        item.value = '';
      }
    }
    return m(item.tag, item.attrs, item.value, item.children);
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
    return(m("section.settings", 
      Extensions.list.map((extension) => {
        return build(extension, [
          'article', extension.name, extension.conf_ui, ['button.reset', 'Reset to Defaults', {onclick: extension.reset}]
        ]);
      })
    ))
  }
}
