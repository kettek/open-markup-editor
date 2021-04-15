const path = require('path');
let target_element = null;
let filepath = '';

ome.on('filepath', (path) => {
  filepath = path;
});
ome.on('ready', () => {
  ome.addLink('./github-markdown.css')
  target_element = document.getElementById('OME_TARGET');
});
ome.on('render', html => {
  target_element.innerHTML = html;
  // Iterate through all elements with src and href, changing their src/href to point to the absolute directory relative to the file's path.
  // NOTE: This seems very inefficient and silly. It would be nicer to implement a higher-level request proxy system, if possible.
  let src_list = target_element.querySelectorAll('[src],[href]');
  var r = new RegExp('^(?:[a-z]+:)?//', 'i');
  for (let i = 0; i < src_list.length; ++i) {
    let item = src_list[i];
    if (item.hasAttribute('href')) {
      let href = item.getAttribute('href');
      if (r.test(href) == false) {
        item.setAttribute('href', path.join(path.dirname(filepath),  href));
      }
    }
    if (item.hasAttribute('src')) {
      let src = item.getAttribute('src');
      if (r.test(src) == false) {
        item.setAttribute('src', path.join(path.dirname(filepath), src));
      }
    }
  }

});
ome.on('line', line => {
  let el = document.querySelector('[data-source-line="'+line+'"]');
  if (el) el.scrollIntoView();
});

ome.on('conf', conf => {
  let body = document.body
  let el = document.getElementsByClassName('markdown-body')[0]
  if (conf.darkmode === true) {
    body.classList.add('-darkmode');
    el.classList.add('-darkmode');
  } else {
    body.classList.remove('-darkmode');
    el.classList.remove('-darkmode');
  }
});

ome.on('conf-set', o => {
  let body = document.body
  let el = document.getElementsByClassName('markdown-body')[0]
  if (o.key === 'darkmode') {
    if (o.value === true) {
      body.classList.add('-darkmode');
      el.classList.add('-darkmode');
    } else {
      body.classList.remove('-darkmode');
      el.classList.remove('-darkmode');
    }
  }
});