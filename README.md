# ![OME owl](build/owl-32x32.png?raw=true) Open Markup Editor
An okay markup editor designed for multiple markup languages and fully customizable HTML rendering.

![Open Markup Editor in action!](screenshot.png?raw=true)

More to be added soon!

## Pluggability
Open Markup Editor provides three systems to customize the functionality and appearance of itself through **Markup Packs**, **Render Packs**, and **Editor Packs**.

### Markup Packs
Open Markup Editor supports user-definable markup language processing through **Markup Packs**. These packs are simply `npm` projects that expose a Markup Pack object as its main module exports.

The basic structure of a Markup Pack is as follows:

  * my_pack/
    * index.js
    * package.json

#### package.json
This file follows the standard [npm package.json](https://docs.npmjs.com/files/package.json) format.

At minimum, it should provide similar to the following:

    {
      "name": "ome-mp-smarter",
      "version": "1.0.0",
      "description": "Open Markup Editor Markup Pack that Makes Your Text Smarter(tm)",
      "main": "index.js",
      "author": "kts",
      "license": "GPL-3.0"
    }

#### index.js
This file -- or one defined as `main` in `package.json` -- should return an object conforming to the following structure:

  * `supports` *&lt;Array&gt;* -- An array of RegExp strings to be used for file extension matching.
  * `create` *&lt;Function&gt;* -- Function to handle creating an instance of the markup pack.
    * `pack` *&lt;MarkupInstance&gt;* -- Instance of the MarkupPack to setup.
      * `load` *&lt;Function&gt;* -- `require()`s, etc.
      * `render` *&lt;Function&gt;* -- Text transformation function.
        * `text` *&lt;String&gt;* -- The original text to be transformed.
        * Return *&lt;String&gt;* -- The transformed text

A brief example:

    module.exports = {
      supports: ['txt'],
      create: (pack) => {
        render: (text) => {
            return text.toUpperCase();
        }
      }
    }

### Render Packs
In addition to the backend transforming of text to HTML, Open Markup Editor also provides user-definable render front-ends known as **Render Packs**. These packs are also `npm` projects that expose a Render Pack object as its main module exports.

The basic structure of a Render Pack should be similar to:

  * render_pack/
    * index.js
    * preload.js
    * preview.html
    * package.json
    
#### package.json
This file follows the standard [npm package.json](https://docs.npmjs.com/files/package.json) format.

At minimum, it should provide similar to the following:

```
{
  "name": "ome-rp-smarter",
  "version": "1.0.0",
  "description": "Open Markup Editor Render Pack that Makes Your Text Smarter(tm)",
  "main": "index.js",
  "author": "kts",
  "license": "GPL-3.0"
}
```

#### index.js
This file should return an object conforming to the following structure:

  * `targets` *&lt;Array&gt;* -- An array of RegExp strings to be used for type matching.
  * `preload` *&lt;String&gt;* -- A file holding the JavaScript that should be preloaded with the preview file.
  * `preview` *&lt;String&gt;* -- A file holding the HTML template to use for rendering.

An Example:

```
module.exports = {
  targets: [".*"],
  preload: __dirname+'/preload.js',
  preview: __dirname+'/preview.html'
}
```

#### preload.js
The contents of this file is loaded by Open Markup Editor and can use the entire NodeJS environment. This is where code for handling of Open Markup Editor's rendering events must be placed.

Until more documentation is made available, the following shows most of the functionality:

```
let target_element = null;

ome.on('ready', () => {
  target_element = document.getElementById('OME_TARGET');
});
ome.on('render', html => {
  target_element.innerHTML = html;
});
ome.on('line', line => {
  let el = document.querySelector('[data-source-line="'+line+'"]');
  if (el) el.scrollIntoView();
});
```

#### preview.html
This file is where the rendering HTML will be placed. The exact location of where the HTML is placed is determined by `preload.js`.

Example:

```
<!DOCTYPE html>
  <head>
    <meta charset="UTF-8">
    <style>
    </style>
  </head>
  <body id='OME_TARGET'>
  </body>
</html>
```

### Editor Packs
An Editor Pack provides the display and control of the raw text within OME.

The basic structure of an Editor Pack is as follows:

  * my_pack/
    * index.js
    * package.json

#### package.json
This file follows the standard [npm package.json](https://docs.npmjs.com/files/package.json) format.

It should provide similar to the following:

    {
      "name": "ome-ep-smarter",
      "version": "1.0.0",
      "description": "Open Markup Editor Editor Pack that Makes Your Text Smarter(tm)",
      "main": "index.js",
      "author": "kts",
      "license": "GPL-3.0"
    }

#### index.js
This file -- or one defined as `main` in `package.json` -- should return an object conforming to the following structure:

  * `create` *&lt;Function&gt;* -- Function to handle creating an instance of the markup pack.
    * `editor` *&lt;EditorInstance&gt;* -- Instance of the editor to setup.

#### EditorInstance
The EditorInstance object represents the editor view of OME. The basic lifecycle of the EditorInstance is as follows:

  * `load()`
    * Emit:
      * `css-load`
      * `ready`
  * `[getText]`, if defined, returns the document contents
  * Handle:
    * `dom-attach` event
    * `doc-new`, `doc-set`, `doc-focus`, `doc-close` events
  * Emit:
    * `change` when the user changes the document
    * `line` when the user navigates to a different line in the document
  * `unload()`
    * Emit:
      * `css-unload`

It is assumed that the Editor instance keeps track of its current focused document and that this focus is synchronized with OME's focused document through the various `dom-*` events.

##### Function: load
Function to call when the editor instance is loaded.

The `ready` Event should be emitted here.

```
editor.load = () => {
  // Requires, etc.
  editor.emit('ready');
};
```

##### Function: unload
Function to call when the editor instance to be unloaded.

```
editor.unload = () => {
  // Unload CSS, etc.
}
```

##### Function: getText
  * `index` *&lt;Number&gt;* -- Index of document contents to return
  
Providing this method will force OME to load the file content from this editor instance rather than from its own storage. If defined, the EditorPack _must_ manage all document text itself.

```
editor.getText = index => {
  return editor.files[index].text;
}
```

##### On: 'dom-attach'
  * `dom` *&lt;Object&gt;* -- The `textarea` element to attach to.

Emitted when the Editor instance should modify or attach itself to the given DOM.

```
editor.on('dom-attach', (textarea) => {
  editor.dom = textarea;
});
```
  
##### On: 'doc-new'
  * `index` *&lt;Number&gt;* -- Index of the new document
  * `filename` *&lt;String&gt;* -- Filename of the new document
  
Emitted when the Editor instance should create a new document at a given index in its documents list.

```
editor.on('doc-new', (index, filename) => {
  editor.files.splice(index, 0, {name: filename, text: ''});
});
```
  
##### On: 'doc-set'
  * `index` *&lt;Number&gt;* -- Index of the document to set
  * `content` *&lt;String&gt;* -- Text content to set document to
  
```
editor.on('doc-set', (index, content) => {
  editor.files[index].text = content;
});
```
  
##### On: 'doc-focus'
  * `index` *&lt;Number&gt;* -- Index of document to set focus to

```
editor.on('doc-focus', (index) => {
  editor.dom.innerText = editor.files[index].text;
});
```

##### On: 'doc-close'
  * `index` *&lt;Number&gt;* -- Index of document to close
 
```
editor.on('doc-close', (index) => {
  editor.files.splice(index, 1);
});
```
 
##### On: 'doc-move'
  * `index` *&lt;Number&gt;* -- Index of document to move
  * `insertion_index` *&lt;Number&gt;* -- Insert index to move document to
  
```
editor.on('doc-move', (index, insertion_index) => {
  //
});
```
  
In addition to these, the following Events may be emitted by the editor via `editor.emit(event, ...)`:

##### Emit: 'ready'
Emitted when the Editor is ready to be used.

```
editor.load = () => {
  editor.emit('css-load', path.join(__dirname, 'my_css.css'));
  editor.emit('ready');
};
```

##### Emit: 'change'
  * `index` &lt;Number&gt; -- Index of the document changed

Emitted whenever a change is made to the document, such as when the user adds or deletes characters.

```
editor.dom.addEventListener('change', () => {
	editor.emit("change", editor.focused);
});
```

##### Emit: 'line'
  * `index` &lt;Number&gt; -- Index of the document whose line position changed
  * `line` &lt;Number&gt; -- Line position
  
Emitted whenever the line position changed, such as when the user moves with the cursor keys.

```
editor.emit("line", editor.focused, new_position);
```

##### Emit: 'css-load'
  * `URL` &lt;string&gt; -- Location of CSS to add to the document's &lt;head&gt;

Emitted when a CSS resource should be loaded. It is recommended to unload all loaded CSS when they are no longer required.

```
editor.emit('css-load', path.join(__dirname, 'my_css.css'));
```

##### Emit: 'css-unload'
  * `URL` &lt;string&gt; -- Location of CSS to remove from the document's &lt;head&gt;

Emitted when a CSS resource should be unloaded.

```
editor.emit('css-unload', path.join(__dirname, 'my_css.css'));
```

----
 
... this document happily written in Open Markup Editor. ![:)](build/icons/16x16.png?raw=true)
