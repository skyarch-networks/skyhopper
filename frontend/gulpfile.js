var gulp     = require('gulp');
var ts       = require('gulp-typescript');
var tsd      = require('gulp-tsd');
var tsconfig = require('gulp-tsconfig-files');

gulp.task('tsd', function (callback) {
  tsd({
    command: 'reinstall',
    config: 'tsd.json',
  }, callback);
});


gulp.task('ts', function () {
  var tsProject = ts.createProject('tsconfig.json');
  return tsProject.src()
    .pipe(ts(tsProject))
    .js
    .pipe(gulp.dest('./dest/'));
});

gulp.task('watch', function () {
  gulp.watch('./src/**/*.ts', ['ts']);
});

gulp.task('tsconfig', function () {
  gulp.src(['src/**/*.ts'])
    .pipe(tsconfig());
});

gulp.task('default', ['ts', 'watch']);
