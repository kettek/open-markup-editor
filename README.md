# ![OME owl](build/owl-32x32.png?raw=true) Open Markup Editor
An okay markup editor designed for multiple markup languages and fully customizable HTML rendering.

![Open Markup Editor in action!](screenshot.png?raw=true)

## Built-in Features

  * Markup Support:
    * Markdown via [markdown-it](https://github.com/markdown-it/markdown-it), highly customizable via plugins
    * AsciiDoc via [asciidoctor](https://github.com/asciidoctor/asciidoctor.js)
    * Creole via [npm-creole](https://github.com/Zibx/jscreole)
    * Textile via [textile-js](https://github.com/borgar/textile-js)
    * Org-mode via [orgajs](https://github.com/orgapp/orgajs)
   * Render themes!
     * Comes with GitHub and a Default theme
   * Custom colorization
     * Windows 10+ automatic adapting based upon current color scheme
   * Custom fonts
   * Automatic file reloading on change
   * Full CodeMirror editor pack
     * All CodeMirror themes
     * vim, emacs, sublime keybinding support
     * Tabs or spaces, along with default spaces per tab
   * And more!

## Pluggability
A key feature of OME is that of modularity, made possible through NPM modules named [Packs](docs/packs.md).

Through this system, four different types of packs can be created:
  * [Markup Packs](docs/markup-packs.md)
  * [Render Packs](docs/render-packs.md)
  * [Editor Packs](docs/editor-packs.md)
  * [Extension Packs](docs/extension-packs.md)
  
The purpose of these is outlined in the primary packs document with further details listed on each pack type's individual documentation.

## Installation
Download the [latest release](https://github.com/kettek/open-markup-editor/releases) and install as below (or otherwise).

### Arch Linux / Manjaro
Download the `open-markup-editor-MAJOR.MINOR.PATCH.pacman` file and install by issuing the following in the terminal:

```
# sudo pacman -U open-markup-editor-MAJOR.MINOR.PATCH.pacman
```

### Mac OS
Mount the `Open.Markup.Editor-MAJOR.MINOR.PATCH.dmg` file and extract the `Open Markup Editor.app` application into wherever you wish for OME to be installed to. Once this is done, right-click the app and select *Open*.

### Windows
Either download and run the `Open.Markup.Editor.Setup-2.3.0.exe` or `Open.Markup.Editor-2.3.0.exe`. The first file installs OME system-wide while the second file can be considered as portable.

## Building
Clone this repository, then:

```
# cd open-markup-editor
# npm i
```

After this, either run `npm run start` to start OME for development or `npm run dist` to build packages/installers for your current platform.

----
 
... this document and those in `docs/` have been happily written in Open Markup Editor. ![:)](build/icons/16x16.png?raw=true)
