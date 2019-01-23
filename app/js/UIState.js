const emitter = require('./emitter');

let UIState = {
  show_config: false,
  events: emitter({})
};

module.exports = UIState;
