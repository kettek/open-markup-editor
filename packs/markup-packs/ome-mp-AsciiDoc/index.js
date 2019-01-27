module.exports = {
  name: 'AsciiDoc',
  supports: ['.adoc', '.asciidoc', '.asc', '.txt'],
  extensions: [
    {
      name: 'emoji', desc: 'An extension for Asciidoctor.js that turns emoji:cat[] into 🐱!', example: 'emoji:cat[]', src: 'asciidoctor-emoji'
    }
  ],
  setup: pack => {
    let asciidoctor = null;
    let registry = null;

    pack.conf({
      active_extensions: pack.extensions.map((lib, index) => {
        return lib.name;
      })
    },
    ['section', {style: 'flex-direction: column;align-items:flex-start', title: "Available and active Asciidoctor.js extensions"},
      ['label', 'Extensions', ''],
      ['listbuilder', '', '', {
        left_items: () => {
          let active = pack.get('active_extensions');
          return pack.extensions.reduce( (list, item) => {
            if (active.indexOf(item.name) === -1) {
              list.push({name: item.name, title: item.desc});
            }
            return list;
          }, [])
        },
        right_items: () => {
          let active = pack.get('active_extensions');
          return pack.extensions.reduce( (list, item) => {
            if (active.indexOf(item.name) !== -1) {
              list.push({name: item.name, title: item.desc});
            }
            return list;
          }, [])
        },
        onchange: (e) => {
          pack.set('active_extensions', e.right_items.map(item => { return item.name; }));
        }
      }]
    ]);

    pack.render = (text) => {
      return asciidoctor.convert(text, {'extension_registry': registry});
    };

    pack.cheatsheet = () => {
      let cheatsheet = '';
      return {
        text: cheatsheet,
        html: pack.render(cheatsheet)
      }
    };

    pack.on('enable', () => {
      asciidoctor = require('asciidoctor.js')();
      setRegistry();
    });

    function setRegistry() {
      registry = asciidoctor.Extensions.create();
      let active = pack.get('active_extensions');
      for (let i = 0; i < active.length; i++) {
        let index = pack.extensions.map( d => {return d.name}).indexOf(active[i]);
        if (index == -1) continue;
        let extension = require(pack.extensions[index].src);
        extension.register(registry);
      }
    }

    pack.on('conf-set', (key, value) => {
      setRegistry();
    });

    pack.on('disable', () => {
      delete require.cache[require.resolve('asciidoctor.js')];
      asciidoctor = null;
      registry    = null;
    });
  }
};
