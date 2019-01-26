# Packs
Open Markup Editor uses `pack`s  as its main method to provide functionality for editing, parsing, rendering, and otherwise. Each type is listed [here](#pack-types).

## Structure
Although the different pack types require specific properties, each type follows the following structuring.

### Directory Hierarchy
```
my_module/
    index.js
    package.json
```

The directory structure of a markup pack consists of, at minimum, a `package.json` file and an accompanying **main** JavaScript file as defined by `package.json` or the default of `index.js`.

#### package.json
`package.json` is as per any other NPM module. The module naming scheme for markup packs is:

    ome-<TYPE>-<NAME-OF-MY-PACK>

Type should be:
  * **mp** for markup packs
  * **rp** for render packs
  * **ext** for extension packs
  * **ep** for editor packs

### index.js
Your main file, which may or may not be named `index.js`, must export an object correspond to the following skeleton structure:

| Property  | Type   | Notes | Description
|-|-|-|-
| name      | String |  | The "pretty" name of the pack, used for the heading of the configuration section UI.
| setup     | function(packInstance) | optional | A function that recieves an instance of the pack. Used to setup callbacks, emitters, and configuration.

    module.exports = {
        name: 'my markup pack',
        ...
    }

Each type of pack requires different properties, each of which is explained in the pack's corresponding section.

## Pack Types
### Extension Packs
Extension packs are the most generic type of pack. They provide extended functionality for the entirity of OME, such as styling the interface or otherwise.

They are located in in the `extension-packs` directory in any of the possible locations of OME data. See [OME](ome) for more information on these locations.

### Markup Packs
Markup packs provide the functionality and configuration for rendering the raw text of an open file into HTML output.

They are located in the `markup-packs` directory.

See [Markup Packs](markup-packs) for additional information.

### Render Packs
Render packs provide the rendering context of text parsed by a markup pack. These provide the right-hand "preview" rendering of markup in the application.

They are located in the `render-packs` directory.

See [Render Packs](render-packs) for additional information.

### Editor Packs
Editor packs provide the editing context and controls of text read from a file. These provide the left-hand "editor" view of raw markup in the application.

They are located in the `editor-packs` directory.

See [Editor Packs](editor-packs) for additional information.

## Pack Listening Events
For any pack that has a `setup(packInstance)` stage, the following events can be hooked into and used by the packInstance.

### `global-conf-set`
If a pack provides a listener to the `global-conf-set`, any configuration change will be reported to the packInstance with the following arguments:

| Argument  | Name      | Type   | Description 
|-----------|-----------|--------|-------------
| 1         | key       | String | The updated key in the global configuration.
| 2         | value     | Any    | The new value.
| 3         | isDefault | Bool   | Whether or not the value is the default value.

## Pack Emitting Events
Any pack can emit the following events via the `emit(eventname, ...)` method.

### `redraw`
Causes OME to redraw the entire interface.

## Pack Methods
All pack instances have access to the following methods.

### `emit(eventName, ...)`
Emits an event to any listeners. Event arguments are variadic.

### `on(eventName, callback)`
Listens for an event and handles the variadic arguments via a callback.

### `off(eventName, callback)`
Removes listening for a given event and callback.

### `conf(packConf, uiConf)`
Sets up the pack's configuration and configuration UI.

TODO
 
### `reset()`
Resets the pack to its default configuration as provided by `conf(...)`.

### `set(key, value)`
Sets a configuration entry for the pack.

### `get(key)`
Returns the stored value for a configuration entry.

### `load(filepath)`
Dynamically loads the given file into the main DOM. Used for loading external scripts and CSS.

FIXME: only supports files ending in '.css'

### `unload(filepath)`
Counterpart to `load(...)`. Removes the loaded file from the main DOM.
