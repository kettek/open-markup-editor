let m = require('mithril');

let Files = require('../models/Files');
let Config = require('../models/Config');
let Extensions = require('../Extensions');

const defined_elements = {
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

function buildExtensionView(extension, ui) {
  // TODO: Rework this hot garbage
  let stepOne = {
    tag: '',
    key: '',
    value: '',
    attrs: {},
    children: []
  };

  for (let i = 0; i < ui.length; i++) {
    if (typeof ui[i] === 'string') {
      if (i === 0) { // Type
        stepOne.tag = ui[i];
      } else if (i === 1) { // Contents
        stepOne.value = ui[i];
      } else if (i === 2) { // Key
        stepOne.key = ui[i];
      }
    } else if (Array.isArray(ui[i])) {
      for (let j = 0; j < ui[i].length; j++) {
        stepOne.children.push(buildExtensionView(extension, ui[i][j]));
      }
    } else if (typeof ui[i] === 'Object') {
      stepOne.attrs = Object.assign(stepOne.attrs, ui[i]);
    }
  }

  // Apply element filter
  let e_handler = defined_elements[stepOne.tag];
  if (e_handler) {
    if (stepOne.key && e_handler.map.key) {
      stepOne.attrs[e_handler.map.key] = extension.short_name+'_'+stepOne.key;
      if (e_handler.map.value) {
        let stored_value = Config.get('extensions.' + stepOne.attrs[e_handler.map.key].replace('_','.'));
        if (stored_value) stepOne.value = stored_value;
      }
    }
    if (stepOne.tag && e_handler.tag) {
      stepOne.tag = e_handler.tag.replace('%TYPE%', stepOne.tag);
    }
    if (stepOne.value && e_handler.map.value) {
      stepOne.attrs[e_handler.map.value] = stepOne.value;
    }
    for (let i = 0; e_handler.events && i < e_handler.events.length; i++) {
      stepOne.attrs['on'+e_handler.events[i]] = (e) => {
        extension.setConf(stepOne.key, e.target[e_handler.map.value]);
      }
    }
  }

  return m(stepOne.tag, stepOne.attrs, stepOne.children, stepOne.value);
}

module.exports = {
  view: (vnode) => {
    return(m("section.settings", 
      Extensions.list.map((extension) => {
        return buildExtensionView(extension, extension.conf_ui);
      })
    ))
  }
}
