const CodeMirror = require('codemirror');
                   require('codemirror/mode/markdown/markdown');

const path = require('path');

module.exports = (editor) => {
  editor.emit("css-load", path.join(__dirname, 'node_modules/codemirror/lib/codemirror.css'));
  editor.emit("css-load", path.join(__dirname, 'node_modules/codemirror/theme/material.css'));
  const newFile = (filename="", content="", mode="markdown") => {
    return {
      doc: CodeMirror.Doc(content, mode)
    }
  }
  editor.focused = -1;
  editor.files = [];
  editor.on('dom-attach', (dom) => {
    if (!editor.cm) {
      editor.cm = CodeMirror.fromTextArea(dom, {
        lineNumbers: true,
        lineWrapping: false,
        theme: 'material'
      });
      editor.cm.on("changes", (cm, changes) => {
        editor.emit("change", editor.focused);
      });
      //
      editor.cm.on("cursorActivity", (cm) => {
        editor.emit("line", editor.focused, cm.getDoc().getCursor().line);
      });
      editor.cm.on("viewportChange", (cm, from, to) => {
      });
    }
  });
  editor.on('doc-new', (index, filename) => {
    // Create new document at position in editor list
    editor.files.splice(index, 0, newFile(filename));
  });
  editor.on('doc-set', (index=editor.focused, content) => {
    if (index < 0 || index > editor.files.length-1) return;
    // Set document data at position in editor list
    editor.files[index].doc.setValue(content);
  });
  editor.on('doc-focus', (index=editor.focused) => {
    if (index < 0 || index >= editor.files.length) return;
    // Hide old focus and bring target document into focus
    editor.cm.swapDoc(editor.files[index].doc);
    editor.focused = index;
  });
  editor.on('doc-close', (index=editor.focused) => {
    if (index < 0 || index > editor.files.length-1) return;
    // Close document at position in editor list
    editor.files.splice(index, 1);
  });
  editor.on('doc-move', (index=editor.focused, insertion_point) => {
    if (index < 0 || index > editor.files.length-1) return;
    // Reposition document at position to insertion point
  });
  // Override main text handling
  editor.getText = (index) => {
    if (index < 0 || index > editor.files.length-1) return;
    return editor.files[index].doc.getValue();
  };
}
