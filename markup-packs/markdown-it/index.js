let md = new require('markdown-it')();
    md.use(require('markdown-it-task-lists'));
    md.use(require('markdown-it-inject-linenumbers'));

module.exports = {
  supports: ['md', 'markdown'],
  render: (text) => {
    return md.render(text);
  }
}
