# Open Markup Editor
A nice markup editor designed for multiple markup languages and fully customizable HTML rendering.

More to be added soon!

## Pluggability
### Markup Packs
Open Markup Editor supports user-definable markup language processing through **Markup Packs**. These packs are simply `npm` projects that expose a Markup Pack object as its main module exports.

#### Example: Markup Pack
The basic structure of a Markup Pack is as follows:

  * my_pack/
    * index.js
    * package.json

##### package.json
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

##### index.js
This file -- or one defined as `main` in `package.json` -- should return an object conforming to the following structure:

  * `supports` *&lt;Array&gt;* -- An array of RegExp strings to be used for file extension matching.
  * `render` *&lt;Function&gt;* -- The function to be executed when the text should be transformed to HTML.
    * `text` *&lt;String&gt;* -- The original text to be transformed.
    * Return *&lt;String&gt;* -- The transformed text

A brief example:

    module.exports = {
      supports: ['txt'],
      render: (text) => {
        return text.toUpperCase();
      }
    }

### Render Packs
In addition to the backend transforming of text to HTML, Open Markup Editor also provides user-definable render front-ends known as **Render Packs**. These packs are also `npm` projects that expose a Render Pack object as its main module exports.

#### Example: Render Pack
The basic structure of a Render Pack could be similar to:

  * render_pack/
    * index.js
    * preload.js
    * preview.html
    * package.json
    
##### package.json
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

##### index.js
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

##### preload.js
The contents of this file is loaded by Open Markup Editor and can use the entire NodeJS environment. This is where code for handling of Open Markup Editor's rendering events must be placed.

Until more documentation is made available, the following shows most of the functionality:

```
const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('webview-disable-external-navigation', true);
  window.onbeforeunload = () => {
    ipcRenderer.send('webview-disable-external-navigation', false);
  }

  const target_element = document.getElementById('OME_TARGET');
  ipcRenderer.on('render', (event, message) => {
    target_element.innerHTML = message;
  });
  ipcRenderer.on('line', (event, message) => {
    let el = document.querySelector('[data-source-line="'+message+'"]');
    if (el) {
      el.scrollIntoView();
    }
  });
});
```

##### preview.html
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


... this document proudly written in Open Markup Editor. :)
