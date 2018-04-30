let m = require('mithril');
let Config = require('../models/Config');

let EditorPacks = require('../models/EditorPacks');

let Files = require('../models/Files');

module.exports = {
  view: (parent, attrs) => {
    return m('section.editor', (Config.element_settings["SECTION.editor"] ? Config.element_settings["SECTION.editor"] : {}), [
      m(".editor-wrapper", m("textarea", {
        oncreate: (vnode) => {
          vnode.state.editor = EditorPacks.createEditor();
          // 1. Hook editor up to Files
          vnode.state.editor.emit("dom-attach", vnode.dom);
          for (let i = 0; i < Files.loadedFiles.length; i++) {
            vnode.state.editor.emit("doc-new", i, Files.loadedFiles[i].name);
            vnode.state.editor.emit("doc-set", i, Files.loadedFiles[i].text);
          }
          vnode.state.editor.emit("doc-focus", Files.focused);
          Files.on('file-load', (index) => {
            vnode.state.editor.emit("doc-new", index, Files.getFileName(index));
            vnode.state.editor.emit("doc-set", index, Files.getFileText(index));
            vnode.state.editor.emit("doc-focus", Files.focused);
          });
          Files.on('file-close', (index) => {
            vnode.state.editor.emit("doc-close", index);
            vnode.state.editor.emit("doc-focus", Files.focused);
          });
          // 2. Hook Files up to editor.
          if (vnode.state.editor.getText) {
            Files.on("get-text", vnode.state.editor.getText);
          }
          vnode.state.editor.on("line", Files.setFileLine);
          // Ugliness here.
          let updateTimeout = 0;
          let updateFunction = () => {
            Files.setFileDirty(Files.focused, true);
            m.redraw();
            updateTimeout = null;
          };
          vnode.state.editor.on("change", index => {
            Files.setFileSaved(index, false);
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(updateFunction, Config.editor.update_delay);
          });
        },
        onupdate: (vnode) => {
          if (vnode.state.editor) {
            vnode.state.editor.emit("doc-focus", parent.attrs.fileIndex);
          }
        }
      }))
    ])
  },
  oncreate: (vnode) => {
  }
}
