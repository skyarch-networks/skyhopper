var gulp     = require('gulp');
var ts       = require('gulp-typescript');
var gulpTypings = require("gulp-typings");

var tsconfig = require('gulp-tsconfig-files');
var tslint   = require('gulp-tslint');


gulp.task("type",function(){
    var stream = gulp.src("./typings.json")
        .pipe(gulpTypings()); //will install all typingsfiles in pipeline.
    return stream; // by returning stream gulp can listen to events from the stream and knows when it is finished.
});

gulp.task('ts', function () {
  var tsProject = ts.createProject('tsconfig.json');
  return tsProject.src()
    .pipe(ts(tsProject))
    .js
    .pipe(gulp.dest('./dest/'));
});

gulp.task('watch', function () {
  gulp.watch('./+(src|test)/**/*.ts', ['ts', 'tslint']);
});

gulp.task('tsconfig', function () {
  gulp.src(['src/**/*.ts', 'test/**/*.ts', 'typings/**/*.ts'])
    .pipe(tsconfig({newline_eof: true}));
});

gulp.task('tslint', function () {
  gulp.src(['src/**/*.ts', 'test/**/*.ts'])
    .pipe(tslint())
    .pipe(tslint.report('verbose', {emitError: false}));
});

gulp.task('default', ['ts', 'tslint', 'watch']);
