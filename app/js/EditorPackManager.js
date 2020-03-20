const MM = require('./PackManager');

const EditorPackManager = MM('editor-packs', {
  pack_type: 'editor',
  pack_type_short: 'ep',
  getEditor: (index=0) => {
    if (index < 0 || index >= EditorPackManager.packs.length) return null;
    return(EditorPackManager.packs[index]);
  },
  mod_replace_string: "$OME_EDITOR_PACKS"
});

module.exports = EditorPackManager;
