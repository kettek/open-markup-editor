module.exports = {
  name: 'Markdown',
  supports: ['md', 'markdown'],
  create: (pack) => {
    let md = null;
  
    pack.load = () => {
      md = new require('markdown-it')();
      md.use(require('markdown-it-task-lists'));
      md.use(require('markdown-it-inject-linenumbers'));
      pack.emit('ready');
    }
    pack.render = (text) => {
      return md.render(text);
    }
  }
};
