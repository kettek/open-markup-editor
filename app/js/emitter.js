module.exports = (obj={}) => {
  let emitter = Object.assign({}, obj)
  emitter.on    = (name, cb) => (emitter.on[name] = emitter.on[name] || []).push(cb);
  emitter.off   = (name, cb) => {
    if (!emitter.on[name]) return;
    const index = emitter.on[name].indexOf(cb);
    if (index !== -1) {
      emitter.on[name].splice(index, 1);
    }
  }
  emitter.emit  = (name, ...data) => {
    if (!emitter.on[name]) return;
    let return_data;
    for (let cb of emitter.on[name]) {
      return_data = cb(...data) || return_data;
    }
    return return_data;
  }
  return emitter;
}
