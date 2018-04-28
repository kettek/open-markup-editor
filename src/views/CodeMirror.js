let m = require('mithril');
let CodeMirror = require('codemirror');
                 require('codemirror/mode/markdown/markdown');

let Files = require('../models/Files');

let CodeMirrorComponent = {
  oncreate: (vnode) => {
    // TODO: dynamically change mode, somehow!
    let cm = CodeMirror.fromTextArea(vnode.dom, {
      lineNumbers: true,
      lineWrapping: false,
      viewportMargin: 0,
      mode: "markdown"
    });
    let lastChange = + new Date();

    const UPDATE_DELAY = 250;

    let updateTimeout = 0;
    let updateFunction = () => {
      Files.setFileText(Files.focused, cm.getDoc().getValue());
      Files.setFileDirty(Files.focused, true);
      m.redraw();
      updateTimeout = null;
    };
    cm.on("cursorActivity", (cm) => {
      let li = cm.getDoc().getCursor().line;
      /*let vp = cm.getViewport();
      vp.from += 10;
      vp.to -= 10;
      if (li >= vp.to) {
        Files.setFileLine(Files.focused, li);
        m.redraw();
      } else if (li <= vp.from) {
        Files.setFileLine(Files.focused, li);
        m.redraw();
      }*/
      Files.setFileLine(Files.focused, li);
      m.redraw();
    });
    cm.on("viewportChange", (cm, from, to) => {
      Files.setFileLine(Files.focused, from);
      m.redraw();
    });
    cm.on("changes", (e, a) => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(updateFunction, UPDATE_DELAY);
    });
    // ... This seems bad.
    vnode.state.CodeMirror = cm;
  },
  onupdate: vnode => {
    //vnode.state.CodeMirror.refresh();
  },
  view: (vnode) => {
    if (vnode.state.CodeMirror) {
      if (Files.should_redraw) {
        vnode.state.CodeMirror.setValue(Files.getFileText(Files.focused));
        vnode.state.CodeMirror.focus();
        vnode.state.CodeMirror.setCursor({line: Files.getFileLine(Files.focused), ch: 0});
      }
    }
    return m("textarea", {
      value: Files.getFileText(Files.focused)
    })
  }
};

module.exports = CodeMirrorComponent;
