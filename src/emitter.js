module.exports = (obj={}) => {
  let emitter = Object.assign({}, obj)
  emitter.on = (name, cb) => (emitter.on[name] = emitter.on[name] || []).push(cb);
  emitter.emit = (name, ...data) => {
    if (!emitter.on[name]) return;
    let return_data;
    for (let cb of emitter.on[name]) {
      return_data = cb(...data) || return_data;
    }
    return return_data;
  }
  return emitter;
}
