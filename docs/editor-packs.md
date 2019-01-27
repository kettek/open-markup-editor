# Editor Packs
Editor packs provide the left-hand editor section of OME.

Majority of the functionality of the editor pack is done through the pack's [setup](#setup) stage.

## Module Export
The module should also export `setup`.

Ex.
```
module.exports = {
  name: 'Editor Pack Name',
  setup: (editor) => {
  }
};
```

## Pack Setup
The pack module's `setup(pack)` step must set up numerous event handlers and callbacks to provide proper editor functionality.

Importantly, if the pack instance defines the [getText](#method-gettext) method during the `setup` phase, then the editor will be responsible for managing the content of the files directly.

### Definable Methods

#### Method: getText
  * `index` *&lt;Number&gt;* -- Index of document contents to return

Providing this method will force OME to load the file content from the pack instance rather than from its own storage. If defined, the EditorPack _must_ manage all document text itself.

### Event Emitters
The following events can be emitted by the pack.

#### Emit: ready
Emitted when the Editor is ready to be used.

```
editor.load = () => {
  editor.emit('css-load', path.join(__dirname, 'my_css.css'));
  editor.emit('ready');
};
```

#### Emit: change
  * `index` &lt;Number&gt; -- Index of the document changed.

Emitted whenever a change is made to the document, such as when the user adds or deletes characters.

```
editor.dom.addEventListener('change', () => {
	editor.emit("change", editor.focused);
});
```

#### Emit: 'line'
  * `index` &lt;Number&gt; -- Index of the document whose line position changed.
  * `line` &lt;Number&gt; -- Line position.
  
Emitted whenever the line position changed, such as when the user moves with the cursor keys.

```
editor.emit("line", editor.focused, new_position);
```

#### Emit: 'css-load'
  * `URL` &lt;string&gt; -- Location of CSS to add to the document's &lt;head&gt;

Emitted when a CSS resource should be loaded. It is recommended to unload all loaded CSS when they are no longer required.

```
editor.emit('css-load', path.join(__dirname, 'my_css.css'));
```

#### Emit: 'css-unload'
  * `URL` &lt;string&gt; -- Location of CSS to remove from the document's &lt;head&gt;

Emitted when a CSS resource should be unloaded.

```
editor.emit('css-unload', path.join(__dirname, 'my_css.css'));
```

### Event Listeners
The following events should be hooked into using the pack's `on(event_name, callback)` method.

It is assumed that the pack instance keeps track of its current focused document and that this focus is synchronized with OME's focused document through the various `dom-*` events.

#### On: enable
The `enable` event is where the pack should set up its state, load any needed CSS via calls such as `pack.load(...)`, and once ready, emit the `ready` event.

```
editor.on('enable', () => {
  // Do stuff.
  editor.emit('ready');
});
```

#### On: disable
The `disable` event is where the pack should clean up its state, unloading any assets it loaded during `enable`.

```
pack.on('disable', () => {
  // Clean up.
});
```

#### On: dom-attach
  * `element` *&lt;Object&gt;* -- The `textarea` element to attach to.

The `dom-attach` event is where the pack should attach itself to the DOM via the provided element. The `element` parameter is an HTML `textarea` element that can be hooked into or replaced.

After `dom-attach` is received, the pack will also receive [doc-new](#on-doc-new) and [doc-set](#on-doc-set) events for each file currently loaded. After this, the pack will also receive a [doc-focus](#on-doc-focus) event with the last target index being the last file.

```
editor.on('dom-attach', (textarea) => {
  editor.dom = textarea;
});
```

#### On: dom-detach (element)
  * `element` *&lt;Object&gt;* -- The `textarea` element to detach from.

The `dom-detach` event is where the pack should detach itself from the DOM.

```
editor.on('dom-detach', (element) => {
  editor.dom = null;
});
```

#### On: doc-new
  * `index` *&lt;Number&gt;* -- Index of the new document.
  * `filename` *&lt;String&gt;* -- Filename of the new document.
  
Emitted when the pack should create a new document at a given index in its documents list.

```
editor.on('doc-new', (index, filename) => {
  editor.files.splice(index, 0, {name: filename, text: ''});
});
```

#### On: doc-set
  * `index` *&lt;Number&gt;* -- Index of the document to set.
  * `content` *&lt;String&gt;* -- Text content to set document to.
  
```
editor.on('doc-set', (index, content) => {
  editor.files[index].text = content;
});
```

#### On: doc-insert
  * `index` *&lt;Number&gt;* -- Index of document to set focus to.
  * `content` *&lt;String&gt;* -- The content to insert into the document.

```
editor.on('doc-insert', (index, content) => {
  // Insert content into editor.dom.innerText in accordance to the cursor location.
});
```

#### On: doc-focus
  * `index` *&lt;Number&gt;* -- Index of document to set focus to.

```
editor.on('doc-focus', (index) => {
  editor.dom.innerText = editor.files[index].text;
});
```

#### On: doc-close
  * `index` *&lt;Number&gt;* -- Index of document to close.
 
```
editor.on('doc-close', (index) => {
  editor.files.splice(index, 1);
});
```

#### On: doc-move
  * `index` *&lt;Number&gt;* -- Index of document to move.
  * `insertion_index` *&lt;Number&gt;* -- Insert index to move document to.
  
```
editor.on('doc-move', (index, insertion_index) => {
  //
});
```

