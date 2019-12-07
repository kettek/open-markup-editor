module.exports = {
  name: 'AsciiDoc',
  supports: {
    'AsciiDoc': ['adoc', 'asciidoc', 'asc', 'txt'],
  },
  extensions: [
    {
      name: 'emoji', desc: 'An extension for Asciidoctor.js that turns emoji:cat[] into 🐱!', example: 'emoji:cat[]', src: 'asciidoctor-emoji'
    }
  ],
  setup: pack => {
    let asciidoctor = null;
    let registry = null;
    let attributes = {};

    pack.conf({
      active_extensions: pack.extensions.map((lib, index) => {
        return lib.name;
      }),
      showtitle: true,
      icons: false,
    },
    ['section', {style: 'flex-direction: column;align-items:flex-start', title: "Available and active Asciidoctor.js extensions"},
      ['label', 'Convert Options', ''],
      ['section', {title: 'Display the title of an embedded document.'}, [
        ['checkbox', '', 'showtitle'],
        ['label', 'Show Title', 'showtitle'],
      ]],
      ['section', {title: 'Use font icons instead of text for admonitions.'}, [
        ['checkbox', '', 'icons'],
        ['label', 'Icons', 'icons'],
      ]],
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
      return asciidoctor.convert(text, {
        extension_registry: registry,
        attributes: attributes
      });
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
      if (pack.get('showtitle') == true) attributes.showtitle = pack.get('showtitle');
      if (pack.get('icons') == true) attributes.icons = 'font';
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
      if (key == 'showtitle') {
        attributes.showtitle = value;
      } else if (key == 'icons') {
        if (value == true) {
          attributes.icons = 'font';
        } else {
          if (attributes.icons) delete attributes.icons;
        }
      }
      setRegistry();
    });

    pack.on('disable', () => {
      delete require.cache[require.resolve('asciidoctor.js')];
      asciidoctor = null;
      registry    = null;
    });
  }
};
