module.exports = {
  name: 'Core Settings',
  setup: (ex) => {
    if (ex.getGlobal('files.watch') == null) {
      ex.setGlobal('files.watch', true);
    }
    if (ex.getGlobal('files.notify_on_change') == null) {
      ex.setGlobal('files.notify_on_change', true);
    }
    if (ex.getGlobal('files.reload_on_change') == null) {
      ex.setGlobal('files.reload_on_change', false);
    }

    // Override reset.
    ex.reset = () => {
      ex.setGlobal('files.watch', true);
      ex.setGlobal('files.notify_on_change', true);
      ex.setGlobal('files.reload_on_change', false);
      ex.setGlobal('editor.linewrapping', true);
      ex.setGlobal('editor.update_delay', 250);
      ex.setGlobal('render.synch_lines', true);
    }

    ex.conf(
      {},
      [
        ['section', {title: "Files configurations", style: "flex-direction: column; align-items: flex-start;" },
          ['label', 'Files', ''],
          ['section', { style: "align-items: stretch;" },
            ['section', {title: "Watch files for changes."},
              ['checkbox', {
                checked: () => ex.getGlobal('files.watch'),
                onchange: () => ex.setGlobal('files.watch', !ex.getGlobal('files.watch'))
              }, 'watch_files'],
              ['label', 'Watch Files', 'watch_files']
            ],
            ['section', {title: "Automatically reload files on change if the file is saved.", disabled: () => { return !ex.getGlobal('files.watch') }},
              ['checkbox', {
                checked: () => ex.getGlobal('files.reload_on_change'),
                onchange: () => ex.setGlobal('files.reload_on_change', !ex.getGlobal('files.reload_on_change'))
              }, 'reload_on_change'],
              ['label', 'Reload on Change', 'reload_on_change']
            ],
            ['section', {title: "Notify user if the file has changed.", disabled: () => { return !ex.getGlobal('files.watch') }},
              ['checkbox', {
                checked: () => ex.getGlobal('files.notify_on_change'),
                onchange: () => ex.setGlobal('files.notify_on_change', !ex.getGlobal('files.notify_on_change'))
              }, 'notify_on_change'],
              ['label', 'Notify on Change', 'notify_on_change']
            ]
          ],
          ['label', 'Editor', ''],
          ['section', { style: "align-items: stretch; flex-direction: column;" },
            ['section', {title: "Wrap lines if they would exceed editor width."},
              ['checkbox', {
                checked: () => ex.getGlobal('editor.linewrapping'),
                onchange: () => ex.setGlobal('editor.linewrapping', !ex.getGlobal('editor.linewrapping'))
              }, 'editor_wrap_lines'],
              ['label', 'Wrap Lines', 'editor_wrap_lines']
            ],
            ['section', {title: "Milliseconds between updating renderer view to editor source."},
              ['number', {
                value: () => ex.getGlobal('editor.update_delay'),
                onchange: (e) => ex.setGlobal('editor.update_delay', e.target.value)
              }, 'editor_update_delay'],
              ['label', 'Render Delay', 'editor_update_delay']
            ],
          ],
          ['label', 'Render', ''],
          ['section', { style: "align-items: stretch;" },
            ['section', {title: "Synchronize renderer line position with editor (dependant upon editor and render pack)."},
              ['checkbox', {
                checked: () => { return ex.getGlobal('render.synch_lines') },
                onchange: () => { ex.setGlobal('render.synch_lines', !ex.getGlobal('render.synch_lines')) },
              }, 'render_synch_lines'],
              ['label', 'Synchronize with Editor', 'render_synch_lines']
            ],

          ]
        ]
      ]
    );
  }
}
