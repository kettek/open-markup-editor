const gulp        = require('gulp');
const gulp_to_ico = require('gulp-to-ico');

gulp.task('windows-icons', () => {
  return gulp.src([
    './build/icons/16x16.png',
    './build/icons/20x20.png',
    './build/icons/24x24.png',
    './build/icons/32x32.png',
    './build/icons/40x40.png',
    './build/icons/48x48.png',
    './build/icons/64x64.png',
    './build/icons/96x96.png',
    './build/icons/128x128.png',
    './build/icons/256x256.png'
  ])
  .pipe(gulp_to_ico('icon.ico'))
  .pipe(gulp.dest('./build/'))
});


gulp.task('run', ['windows-icons']);
