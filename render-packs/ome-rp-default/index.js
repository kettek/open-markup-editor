console.log(__dirname);
module.exports = {
  targets: [".*"],
  preload: __dirname+'/preload.js',
  preview: __dirname+'/preview.html'
};
