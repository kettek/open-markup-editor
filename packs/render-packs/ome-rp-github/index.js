module.exports = {
  name: 'GitHub',
  targets: [".*"],
  preload: __dirname+'/preload.js',
  preview: __dirname+'/preview.html',
  setup: pack => {
    pack.conf({
      darkmode: false,
    },
    ['section', {title: "GitHub Options"},
      ['checkbox', '', 'darkmode'],
      ['label', "Dark Mode", 'darkmode'],
    ]);

    let setDarkmode = (v) => {
      pack.emit('preview-conf-set', {
        key: 'darkmode',
        value: v,
      });
    }

    pack.on('enable', () => {
      setDarkmode(pack.get('darkmode'));
    });

    pack.on('conf-set', (key, value) => {
      if (key === 'darkmode') {
        setDarkmode(value);
      }
    });
  }
};
