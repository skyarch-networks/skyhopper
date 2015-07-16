var gulp = require('gulp');
var ts   = require('gulp-typescript');
var tsd  = require('gulp-tsd');

gulp.task('tsd', function (callback) {
  tsd({
    command: 'reinstall',
    config: 'tsd.json',
  }, callback);
});


gulp.task('ts', function () {
  gulp.src(['./frontend/src/**/*.ts'])
    .pipe(ts({
      target: "ES6",
      removeComments: true,
      noImplicitAny: true,
    }))
    .js
    .pipe(gulp.dest('./frontend/dest/'));
});

gulp.task('watch', function () {
  gulp.watch('./frontend/src/**/*.ts', ['ts']);
});

gulp.task('default', ['ts', 'watch']);
