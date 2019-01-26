# Markup Packs
See [Packs](packs) for more information on general pack structure.

## Module Export
The module should also export `supports` and `setup`.

Ex.
```
module.exports = {
  name: 'Markup Pack Name',
  supports: [
    "*.md",
    "*.markdown"
  ],
  setup: (pack) => {
  }
};
```

These properties and their purpose are defined below.

#### supports
An array of regular expressions that define the file extensions that the markup pack provides parsing for.

#### setup
A function that receives a pack instance and must set up the appropriate event hooks and callbacks for the markup pack's usage in rendering of markup and the handling of configuration.

## Pack
During [setup](#setup), a pack must provide the following callback and event handlers to properly function for markup rendering.

### Event Listeners

#### enable
This event is called when the module is enabled and is to be used for parsing.

This event should call `require()` for any desired modules. By using an event to call `require()`, modules can be required conditionally rather than necessarily. This is important for markup packs that allow configurable features that may require external modules.

Additionally, this should be the place for setting up any state required for the usage of the markup parser. In the case of `ome-mp-markdown-it`, this is where `markdown-it` and its modules are `require()`'d and the markdown-it instance is created.

#### disable
This event is called when the module is to be disabled, such as when switching from one markup pack to another.

Any clean up or removal of `require()`'d modules should be done here.

#### conf-set => (key, value)
This event is called whenever the user changes a configuration via the configuration UI that corresponds to [packConf](#packConf). In the case of `ome-mp-markdown-it`, this calls the same setup function as `enable`.

### Methods
These methods should be defined on the `pack` instance in a manner such as:

Ex.
```
pack.render = text => {
    ...
};
```

#### render(text)
This is where the markup pack should convert the provided text into a return value containing the HTML structure as text. In the case of `ome-mp-markdown-it`, this is:

Ex.
```
pack.render = (text) => {
    return md.render(text)
};
```
    
#### conf(packConf, uiConf)

##### packConf
The `packConf` argument is an object that defines the default configuration options associated with the markup pack. It consists of key=>value pairs with the key being the name of the configuration entry and the value being the default value that is used.

Ex.
```
{
    'auto_indent': true,
    ...
}
```

##### uiConf
The `uiConf` argument should be a structured array that adheres to the [OME-UI](OME-UI) declarative syntax.

Ex.
```
[
    ['section', {
            title: 'Autoindent'
        }, [
            ['checkbox', '', 'auto_indent'],
            ['label', 'Auto indent text', 'auto_indent']
        ]
    ]
]
```