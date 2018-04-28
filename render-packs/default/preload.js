let target_element = null;

ome.on('ready', () => {
  target_element = document.getElementById('OME_TARGET');
});
ome.on('render', html => {
  target_element.innerHTML = html;
});
ome.on('line', line => {
  let el = document.querySelector('[data-source-line="'+line+'"]');
  if (el) el.scrollIntoView();
});
