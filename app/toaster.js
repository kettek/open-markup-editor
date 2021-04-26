let m = require('mithril');

let ToasterView = require('./js/views/Toaster');

m.route(document.body, "/", {
  "/": ToasterView
})
