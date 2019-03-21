var fontManager = require('font-manager');

function refreshCSS(props) {
  let style = document.getElementsByTagName('head')[0].querySelector('#OME-FontManager');
  if (style) style.parentNode.removeChild(style);
  if (props) {
    // Build our CSS string
    let css = '\n:root {\n';
    if (props.family) {
      css += '\t--editor-font-family: ' + props.family + ';\n';
    }
    if (props.size) {
      css += '\t--editor-font-size: ' + props.size + ';\n';
    }
    if (props.color) {
      css += '\t--editor-font-color: ' + props.color + ';\n';
    }
    css += '\n}\n';

    // Append to the head!
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.appendChild(document.createTextNode(css));
    style.setAttribute('id', 'OME-FontManager');
    document.getElementsByTagName('head')[0].appendChild(style);
  }
}

module.exports = {
  name: 'Font Manager',
  setup: (ex) => {
    ex.fonts = []
    ex.conf(
      {
        'use_editor_family': false,
        'editor_family': 'Monospace',
        'use_editor_size': false,
        'editor_size': '12',
        'editor_size_units': 'pt',
        'use_editor_color': false,
        'editor_color': '#010101'
      },
      [
        ['section', {title: "Editor font overrides", style: "flex-direction: column; align-items: flex-start;" },
          ['label', 'Editor', ''],
          ['section', { style: "align-items: stretch;" },
            ['section', {style: "flex-direction: column; align-items: flex-start;", title: "Family"},
              ['label', [
                ['checkbox', '', 'use_editor_family'],
                ['label', 'Family', 'use_editor_family']
              ]],
              ['select', '', 'editor_family_index', {
                  'size': 8,
                  'onchange': (e) => {
                    ex.set('editor_family_index', e.target.selectedIndex);
                    ex.set('editor_family', ex.fonts[e.target.selectedIndex].family);
                  }
                },
                () => {
                  return ex.fonts.map((font, index) => {
                    return ['option', font.postscriptName, { value: index, selected: ex.get('editor_family') == font.postscriptName ? true : false }]
                })}
              ]
            ],
            ['section', {style: "flex-direction: column; align-items: flex-start;", title: "Size and Color"},
              ['label', [
                ['checkbox', '', 'use_editor_size'],
                ['label', 'Size', 'editor_size']
              ]],
              ['section', 
                ['number', '', 'editor_size', {
                  'style': 'width: 3em;',
                  'onchange': (e) => {
                    ex.set('editor_size', e.target.value);
                  }
                }],
                ['select', '', 'editor_size_units_index', {
                  'onchange': (e) => {
                    ex.set('editor_size_units_index', e.target.selectedIndex);
                    ex.set('editor_size_units', e.target.selectedOptions[0].value);
                  }
                },
                () => {
                  return [
                    ['option', 'pt', { value: 'pt', selected: ex.get('editor_size_units') == 'pt'}],
                    ['option', 'px', { value: 'px', selected: ex.get('editor_size_units') == 'px'}],
                    ['option', 'vw', { value: 'vw', selected: ex.get('editor_size_units') == 'vw'}]
                  ]
                }]
              ],
              ['label', [
                ['checkbox', '', 'use_editor_color'],
                ['label', 'Color', '']
              ]],
              ['section', 
                ['color', '', 'editor_color'],
                ['hex', '', 'editor_color'],
              ]
            ]
          ],
          ['section', {style: "overflow: auto; width: 100%; height: 3em; padding: 2em;" },
            () => ['input', 'Lorem ipsum dolor sit amet.', { style: "font-family: var(--editor-font-family); font-size: var(--editor-font-size); " + (ex.get('use_editor_color') ? "color: var(--editor-font-color);" : "") + "margin: 0; padding: 0; width: 100%" }]
          ]
        ]
      ]
    );
    ex.on('enable', () => {
      fontManager.getAvailableFonts(function(fonts) { 
        fonts = fonts.filter(font => !font.path.endsWith(".ttc"))
        ex.fonts = fonts.reduce((acc, curr) => {
          if (!acc.some(el => el.family == curr.family)) acc.push(curr)
          return acc
        }, [])
        .sort((a,b) => {
          if (a.postscriptName < b.postscriptName)
            return -1;
          if (a.postscriptName > b.postscriptName)
            return 1;
          return 0;
        });
      });
      let props = {}
      if (ex.get('use_editor_family')) props.family = ex.get('editor_family')
      if (ex.get('use_editor_size')) props.size = ex.get('editor_size') + ex.get('editor_size_units')
      if (ex.get('use_editor_color')) props.color = ex.get('editor_color')
      refreshCSS(props)
      // This is hacky, but we need to let our editor know we've updating the CSS.
      ex.setGlobal('editor.updateTheming', true)
    });
    ex.on('disable', () => {
      refreshCSS(null)
      // This is hacky, but we need to let our editor know we've updating the CSS.
      ex.setGlobal('editor.updateTheming', true)
    });
    ex.on('conf-set', (k, v) => {
      let props = {}
      if (ex.get('use_editor_family')) props.family = ex.get('editor_family')
      if (ex.get('use_editor_size')) props.size = ex.get('editor_size') + ex.get('editor_size_units')
      if (ex.get('use_editor_color')) props.color = ex.get('editor_color')
      refreshCSS(props)
      // This is hacky, but we need to let our editor know we've updating the CSS.
      ex.setGlobal('editor.updateTheming', true)
    });
  }
}
