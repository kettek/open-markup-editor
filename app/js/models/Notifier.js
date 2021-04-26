const Emitter = require('../emitter');

let Notifier = Emitter({
  info: ({title="",body=""}={}) => {
    Notifier.msg({type: 'info', title, body});
  },
  warn: ({title="",body=""}={}) => {
    Notifier.msg({type: 'warning', title, body});
  },
  error: ({title="",body=""}={}) => {
    Notifier.msg({type: 'error', title, body});
  },
  msg: ({type, title, body}) => {
    Notifier.emit('notification', {type, title, body});
  },
});

module.exports = Notifier;