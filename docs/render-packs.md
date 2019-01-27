# Render Packs
Render packs provide the right-hand HTML preview of OME.

## Directory Hierarchy
In addition to the standard pack structure, a render pack must also have an HTML file and a special preload JavaScript file. These are defined in the main pack object provided by the main module script.

## Module Export
The module should also export `targets`, `preload`, and `preview`.

Ex.
```
module.exports = {
  name: 'Render Pack Name',
  targets: [".*"],
  preload: __dirname+'/preload.js',
  preview: __dirname+'/preview.html'
};
```

These properties and their purpose are defined below.

### targets
An array of regular expressions for matching file extensions.

### preload
A string that defines the location of the preload script. A sane default is `__dirname + '/preload.js'`.

See [Preload Script](#preload-script).

### preview
A string that defines the location of the preview HTML. A sane default is `__dirname + '/preview.html'`.

See [Preview HTML](#preview-html).

## Preload Script
The preload script is what sets up the interaction between the editor and the live HTML preview. 

Exposed in the global space is the `ome` object which is used to set up the interactions between OME and the web page.

A base example of a preload script would be:

```
let target_element;

// Set up our permanent references.
ome.on('ready', () => {
  target_element = document.getElementById('OME_TARGET');
});

// Update the page's HTML with a re-rendered version.
ome.on('render', html => {
  target_element.innerHTML = html;
});

// Update some visuals based on a new filepath. May also be used for navigation requests (TODO)
ome.on('filepath', filepath => {
  // ...
});

// Scroll a given line into view. Requires the markup pack to add a 'data-source-line' property to each element.
ome.on('line', line => {
  let el = document.querySelector('[data-source-line="'+line+'"]');
  if (el) el.scrollIntoView();
});


```

### Events

#### ready
The `ready` event is emitted when OME is ready to send HTML to the render pack. It is called when a file is opened.

#### render
The `render` event is emitted when OME wishes for the render pack to display HTML. At the moment it sends a string containing the complete HTML document.

#### filepath
The `filepath` event is emitted when OME wishes for the render pack to be aware that the filepath has changed.

#### line
The `line` event is emitted when OME wishes for the render pack to scroll to a given line in the document. This line corresponds to the line in the source editor. The render pack and the markup pack must be written to use the same method for identifying line-to-element synchronization.

## Preview HTML
The preview HTML is the template that the [preload script](#preload-script) updates to synchronize with the editor.

A basic document, presuming no external styling, would be:

```
<!DOCTYPE html>
  <head>
    <meta charset="UTF-8">
  </head>
  <style>
    body {
      background-color: #fff;
    }
  </style>
  <body>
    <article id="OME_TARGET">
    </article>
  </body>
</html>
```

Scripts, styling, fonts, and otherwise can be included as a normal HTML document. All files will be relative to the pack.