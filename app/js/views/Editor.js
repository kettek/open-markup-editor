let m = require('mithril');
const settings = require('electron-app-settings');
const { ipcRenderer } = require('electron');

let EditorPackManager = require('../EditorPackManager');

let Files = require('../models/Files');

let current_editor = null;
function onFileLoad(index) {
  current_editor.emit("doc-new", index, Files.getFileName(index));
  current_editor.emit("doc-set", index, Files.getFileText(index));
  current_editor.emit("doc-focus", Files.focused);
}
function onFileImport(index, text) {
  current_editor.emit('doc-insert', index, text);
}
function onFileSet(index, text) {
  current_editor.emit("doc-set", index, text);
}
function onFileClose(index) {
  current_editor.emit("doc-close", index);
  current_editor.emit("doc-focus", Files.focused);
}

let updateTimeout = 0;
function updateFunction() {
  Files.setFileDirty(Files.focused, true);
  m.redraw();
  updateTimeout = null;
}
function onEditorChange(index) {
  Files.setFileSaved(index, false);
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(updateFunction, settings.get("editor.update_delay"));
}

function onEditorLine(index, num) {
  Files.setFileLine(index, num)
  // This is a bit iffy to send a preview-update from here, but calling `m.redraw()` in setFileLine breaks range selections in the editor.
  if (settings.get('render.synch_lines') == true) {
    ipcRenderer.send('preview-update', {
      line: Files.getFileLine(Files.focused)
    });
  }
}

function attachEditor(dom) {
  if (current_editor) return;
  current_editor = EditorPackManager.getEditor();
  // 1. Hook editor up to Files
  current_editor.emit("dom-attach", dom);
  for (let i = 0; i < Files.loadedFiles.length; i++) {
    current_editor.emit("doc-new", i, Files.loadedFiles[i].name);
    current_editor.emit("doc-set", i, Files.loadedFiles[i].text);
  }
  current_editor.emit("doc-focus", Files.focused);
  Files.on('file-load', onFileLoad);
  Files.on('file-close', onFileClose);
  Files.on('file-import', onFileImport);
  Files.on('set-text', onFileSet);
  // 2. Hook Files up to editor.
  if (current_editor.getText) {
    Files.on("get-text", current_editor.getText);
  }
  current_editor.on("line", onEditorLine);
  // Ugliness here.
  current_editor.on("change", onEditorChange);
}

function detachEditor() {
  if (!current_editor) return;
  current_editor.off("change", onEditorChange);
  current_editor.off("line", onEditorLine);
  if (current_editor.getText) {
    Files.off("get-text", current_editor.getText);
  }
  Files.off('set-text', onFileSet);
  Files.off('file-import', onFileImport);
  Files.off('file-close', onFileClose);
  Files.off('file-load', onFileLoad);
  current_editor.emit('dom-detach');
  current_editor = null;
}


module.exports = {
  view: (parent, attrs) => {
    return m('section.editor', (settings.get("element_settings.SECTION\\.editor") ? settings.get("element_settings.SECTION\\.editor") : {}), [
      m(".editor-wrapper", m("textarea", {
        oncreate: (vnode) => {
          attachEditor(vnode.dom);
        },
        onremove: (vnode) => {
          detachEditor();
        },
        onupdate: (vnode) => {
          if (current_editor) {
            current_editor.emit("doc-focus", parent.attrs.fileIndex);
          }
        }
      }))
    ])
  }
}
