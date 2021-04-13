const Emitter = require('../emitter');
const BezierEasing = require('bezier-easing');
const easeInOut = BezierEasing(0.42, 0, 0.58, 1.0);

let AppState = Emitter({
  show_config: false,
  _timers: [],
  NewTimingFunction: (which, on_finish, delay) => {
    if (!AppState._timers[which]) {
      AppState._timers[which] = [on_finish];
      let start = new Date();
      let tick_func = () => {
        let elapsed = new Date() - start;
        let completed = Math.round(easeInOut(elapsed / delay) * 100);
        if (elapsed < delay) {
          AppState.emit(which+'-timer', completed);
          for (let i = 0; i < AppState._timers[which].length; i++) {
            AppState._timers[which][i](completed);
          }
        } else {
          AppState.emit(which+'-timer', 100);
          for (let i = 0; i < AppState._timers[which].length; i++) {
            AppState._timers[which][i](100);
          }
          delete AppState._timers[which];
          clearInterval(timer);
        }
      }
      let timer = setInterval(tick_func, 1);
    } else {
      AppState._timers[which].push(on_finish);
    }
  }
});

module.exports = AppState;
