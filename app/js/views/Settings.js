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

const Icon = require('./Icon');

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
    tag: 'option',
  },
  'pre': {
    tag: 'pre',
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
  },
  'icon': {
    mithril: Icon,
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
      } else if (obj[i] == null || typeof obj[i] === 'undefined') {
        // de nada
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
    let tag;
    while ((part = reg.exec(item.tag)) != null) {
      if (part[0][0] == '.') {
        item.classes.push(item.tag.substring(part.index+1, part.index+part[0].length));
      } else if (part[0][0] == '#') {
        item.id = item.tag.substring(part.index+1, part.index+part[0].length);
      }
      if (!tag) {
        tag = item.tag.substring(0, part.index);
      }
    }
    if (tag) item.tag = tag;

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
          // Only add our handler if the user has not overridden it.
          if (!item.attrs['on'+e_handler.events[i]]) {
            item.attrs['on'+e_handler.events[i]] = (e) => {
              extension.set(item.key, e.target[e_handler.map.value]);
            }
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
        item.attrs = Object.assign({
          id: item.id,
          className: item.classes.join(' ')
        }, item.attrs)
        return m(e_handler.mithril, item.attrs, item.children);
      }
      return m(item.tag + (item.classes ? '.'+item.classes.join('.') : '') + (item.id ? '#'+item.id : ''), item.attrs, item.value, item.children);
    }
  }
}

module.exports = {
  download: {
    render: {
      url: '',
      show: false,
    },
    editor: {
      url: '',
      show: false,
    },
    markup: {
      url: '',
      show: false,
    },
    extension: {
      url: '',
      show: false,
    }
  },
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
    // TODO: Normalize all packs to have the same basic functionality and layout. Headers should be: '<show/hide icons> <name> <version>      <updates buttons> <check for updates icon> <disable> <uninstall w/ confirm>'
    function buildPackList(manager) {
      return manager.packs.map((pack, index) => {
        return build(pack, [
          'article', ['header.packHeader', ['span.packHeader__name', pack.name, ['span.packHeader__name__version', pack.version ]],
          pack.conf_ui.length ? ['icon.packHeader__folder.button.'+(pack.shown?'rotate-180':'rotate-90'), '', {
            iconName: 'arrow-up',
            attrs: {
              onclick: () => {pack.shown = pack.shown ? false : true}
            }
          }]:['span'],
          ['span.packHeader__buttons', (pack.read_only
          ?
            [['button.disabled', 'Built-in'],
            ['button.' + (pack.enabled ? 'disable' : 'enable'), pack.enabled ? 'Disable' : 'Enable', {onclick: () => manager.toggle(index)}]]
          :
            [
              (manager.hasUpdate(index)
              ? 
                (manager.isUpdating(index)
                ?
                  ['span', 'updating...']
                :
                  [
                    pack.updates.major ? ['button.update-major', 'major ' + pack.updates.major.tag_name, {
                      onclick: () => {
                        manager.update(index, pack.updates.major.tag_name)
                      }
                    }] : null,
                    pack.updates.minor ? ['button.update-minor', 'minor ' + pack.updates.minor.tag_name, {
                      onclick: () => {
                        manager.update(index, pack.updates.minor.tag_name)
                      }
                    }] : null,
                    pack.updates.patch ? ['button.update-patch', 'patch ' + pack.updates.patch.tag_name, {
                      onclick: () => {
                        manager.update(index, pack.updates.patch.tag_name)
                      }
                    }] : null
                  ].filter(e => e != null)
                )
              :
                null
              ),
              [
                (manager.isChecking(index)
                ?
                  ['span', 'checking...']
                :
                  ['button' + (manager.hasRepository(index) ? '' : '.disabled'), 'Check for Update', {
                    onclick: () => {
                      manager.checkForUpdate(index, m.redraw);
                    }
                  }]
                )
              ],
              ['button', 'Uninstall', {
                  onclick: () => {
                    manager.uninstall(index);
                  }
                }
              ],
              ['button.' + (pack.enabled ? 'disable' : 'enable'), pack.enabled ? 'Disable' : 'Enable', {onclick: () => manager.toggle(index)}]
            ]
          )]
          ],
          (pack.shown && pack.enabled && pack.conf_ui.length > 0) ? pack.conf_ui.concat([['button.reset', 'Reset to Defaults', {onclick: pack.reset}]]) : null
        ]);
      })
    }
    return(
      m("section.settings",
        // Editor Packs
        m("header", "Editor Packs", m('span', {
            style: 'flex: 1; display: flex; justify-content: flex-end; align-items:center;'
          },
            vnode.state.download.editor.show
              ? [m("input[type=text]", {
              onchange: e => {
                vnode.state.download.editor.url = e.target.value
              },
              placeholder: 'https://...'
              }), m(Icon, {
                iconName: 'remove',
                className: 'button remove',
                attrs: {
                  onclick: () => {
                    vnode.state.download.editor.show = false
                  }
                }
              })]
            : null,
            m(Icon, {
              iconName: "download",
              className: "button download",
              attrs: {
                onclick: () => {
                  if (!vnode.state.download.editor.show) {
                    vnode.state.download.editor.show = true
                  } else {
                    vnode.state.download.editor.show = false
                    EditorPackManager.downloadAndInstall(vnode.state.download.editor.url, 0)
                  }
                }
              }
            })),
        m(Icon, {
          iconName: "add",
          className: "button new",
          attrs: {
            onclick: () => {
              dialog.showOpenDialog({
                title: "Install Editor Pack archive",
                filters: [{name: 'Tarballs', extensions: ["tar", "tar.gz", "tgz"]}],
                properties: ["openFile", "showHiddenFiles"]
              }).then(result => EditorPackManager.install(result.filePaths));
            }
          }
        }) ),
        buildPackList(EditorPackManager),
        // Markup Packs
        m("header", "Markup Packs", m('span', {
            style: 'flex: 1; display: flex; justify-content: flex-end; align-items:center;'
          },
            vnode.state.download.markup.show
              ? [m("input[type=text]", {
              onchange: e => {
                vnode.state.download.markup.url = e.target.value
              },
              placeholder: 'https://...'
              }), m(Icon, {
                iconName: 'remove',
                className: 'button remove',
                attrs: {
                  onclick: () => {
                    vnode.state.download.markup.show = false
                  }
                }
              })]
            : null,
            m(Icon, {
              iconName: "download",
              className: "button download",
              attrs: {
                onclick: () => {
                  if (!vnode.state.download.markup.show) {
                    vnode.state.download.markup.show = true
                  } else {
                    vnode.state.download.markup.show = false
                    MarkupPackManager.downloadAndInstall(vnode.state.download.markup.url, 0)
                  }
                }
              }
            })),
         m(Icon, {
          iconName: "add",
          className: "button new",
          attrs: {
            onclick: () => {
              dialog.showOpenDialog({
                title: "Install Markup Pack archive",
                filters: [{name: 'Tarballs', extensions: ["tar", "tar.gz", "tgz"]}],
                properties: ["openFile", "showHiddenFiles"]
              }).then(result => MarkupPackManager.install(result.filePaths));
            }
          }
        }) ),
        m("label", { for: 'ome-default-mp' }, 'Default Markup Pack'),
        m("section", {
          title: "Default markup pack for new files"
        }, [
          m('select', {
            id: 'ome-default-mp',
            onchange: e => {
              MarkupPackManager.setDefault(e.target.selectedIndex)
            },
          }, MarkupPackManager.packs.map((pack, pack_index) => {
            return m('option', {
              value: pack_index,
              selected: MarkupPackManager.isDefault(pack_index)
            }, pack.name)
          }))
        ]),
        buildPackList(MarkupPackManager),
        // Render Packs
        m("header", "Render Packs",
          m('span', {
            style: 'flex: 1; display: flex; justify-content: flex-end; align-items:center;'
          },
            vnode.state.download.render.show
              ? [m("input[type=text]", {
              onchange: e => {
                vnode.state.download.render.url = e.target.value
              },
              placeholder: 'https://...'
              }), m(Icon, {
                iconName: 'remove',
                className: 'button remove',
                attrs: {
                  onclick: () => {
                    vnode.state.download.render.show = false
                  }
                }
              })]
            : null,
            m(Icon, {
              iconName: "download",
              className: "button download",
              attrs: {
                onclick: () => {
                  if (!vnode.state.download.render.show) {
                    vnode.state.download.render.show = true
                  } else {
                    vnode.state.download.render.show = false
                    RenderPackManager.downloadAndInstall(vnode.state.download.render.url, 0)
                  }
                }
              }
            }),
          ),
          m(Icon, {
            iconName: "add",
            className: "button new",
            attrs: {
              onclick: () => {
                dialog.showOpenDialog({
                  title: "Install Render Pack archive",
                  filters: [{name: 'Tarballs', extensions: ["tar", "tar.gz", "tgz"]}],
                  properties: ["openFile", "showHiddenFiles"]
                }).then(result => RenderPackManager.install(result.filePaths));
              }
            }
          }), /*m(Icon, {
            iconName: "add",
            className: "button download",
            attrs: {
              onclick: () => {
                // TODO: download via RenderPackManager.download(url), then call install(filePath)
              }
            }
          })),*/
        ),
        buildPackList(RenderPackManager),
        // ExtensionPackManager
        m("header", "Extensions", m('span', {
            style: 'flex: 1; display: flex; justify-content: flex-end; align-items:center;'
          },
            vnode.state.download.extension.show
              ? [m("input[type=text]", {
              onchange: e => {
                vnode.state.download.extension.url = e.target.value
              },
              placeholder: 'https://...'
              }), m(Icon, {
                iconName: 'remove',
                className: 'button remove',
                attrs: {
                  onclick: () => {
                    vnode.state.download.extension.show = false
                  }
                }
              })]
            : null,
            m(Icon, {
              iconName: "download",
              className: "button download",
              attrs: {
                onclick: () => {
                  if (!vnode.state.download.extension.show) {
                    vnode.state.download.extension.show = true
                  } else {
                    vnode.state.download.extension.show = false
                    ExtensionPackManager.downloadAndInstall(vnode.state.download.extension.url, 0)
                  }
                }
              }
            })),
        m(Icon, {
          iconName: "add",
          className: "button new",
          attrs: {
            onclick: () => {
              dialog.showOpenDialog({
                title: "Install Render Pack archive",
                filters: [{name: 'Tarballs', extensions: ["tar", "tar.gz", "tgz"]}],
                properties: ["openFile", "showHiddenFiles"]
              }).then(result => ExtensionPackManager.install(result.filePaths));
            }
          }
        })),
        buildPackList(ExtensionPackManager),
      )
    )
  }
}
