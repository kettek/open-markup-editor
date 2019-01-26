# Editor Packs
Editor packs provide the left-hand editor section of OME.

Majority of the functionality of the editor pack is done through the pack's [setup](#setup) stage.

## Module Export
The module should also export `setup`.

Ex.
```
module.exports = {
  name: 'Editor Pack Name',
  setup: (pack) => {
  }
};
```

## Pack Setup
The pack module's `setup(pack)` step must set up numerous event handlers and callbacks to provide proper editor functionality.

### Events
The following events should be hooked into using the pack's `on(event_name, callback)` method.

#### enable
The `enable` event is where the pack should set up its state, load any needed CSS via calls such as `pack.load(...)`, and once ready, emit the `ready` event.

```
pack.on('enable', () => {
  // Do stuff.
  pack.emit('ready');
});
```

#### disable
The `disable` event is where the pack should clean up its state, unloading any assets it loaded during `enable`.

```
pack.on('disable', () => {
  // Clean up.
});
```

#### dom-attach (element)
The `dom-attach` event is where the pack should attach itself to the DOM via the provided element. The `element` parameter is an HTML `textarea` element that can be hooked into or replaced.

During this event, the following handlers should be set up to emit... TODO

After `dom-attach` is received, the pack will also receive [doc-new](#doc-new) and [doc-set](#doc-set) events for each file currently loaded. After this, the pack will also receive a [doc-focus](#doc-focus) event with the last target index being the last file.

Importantly, if the pack instance defines the [getText](#getText) method during the `setup` phase, then the editor will be responsible for managing the content of the files directly.

#### dom-detach (element)
The `dom-detach` event is where the pack should detach itself from the DOM.

#### doc-new (index, filename)

#### doc-set (index, content)

#### doc-insert (index, content)

#### doc-focus (index)

#### doc-close (index)

#### doc-move (index, insertion_point)


