module.exports = {
  name: 'Core Settings',
  setup: (ex) => {
    if (ex.getGlobal('editor.watch_files') == null) {
      ex.setGlobal('editor.watch_files', true);
    }
    if (ex.getGlobal('editor.notify_on_change') == null) {
      ex.setGlobal('editor.notify_on_change', true);
    }

    ex.conf(
      {
        'watch_files': ex.getGlobal('editor.watch_files') ? true : false,
        'reload_on_change': ex.getGlobal('editor.reload_on_change') ? true : false,
        'notify_on_change': ex.getGlobal('editor.notify_on_change') ? true : false
      },
      [
        ['section', {title: "Watch files for changes."},
          ['checkbox', '', 'watch_files'],
          ['label', 'Watch files for changes', 'watch_files']
        ],
        ['section', {title: "Automatically reload files on change if the file is saved.", disabled: () => { return !ex.get('watch_files') }},
          ['checkbox', '', 'reload_on_change'],
          ['label', 'Reload on change', 'reload_on_change']
        ],
        ['section', {title: "Notify user if the file has changed.", disabled: () => { return !ex.get('watch_files') }},
          ['checkbox', '', 'notify_on_change'],
          ['label', 'Notify on change', 'notify_on_change']
        ]
      ]
    );
    ex.on('conf-set', (k, v) => {
      if (k == 'watch_files' || k == 'reload_on_change' || k == 'notify_on_change') {
        ex.setGlobal('editor.'+k, v);
      }
    });
  }
}
