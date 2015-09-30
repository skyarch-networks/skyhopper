// Karma configuration
// Generated on Thu Aug 13 2015 15:15:17 GMT+0900 (JST)

module.exports = function(config) {
  var preprocess = ['browserify', 'espower'];

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'mocha'],


    // list of files / patterns to load in the browser
    files: [
      "node_modules/vue/dist/vue.js",
      "node_modules/lodash/index.js",
      "node_modules/power-assert/build/power-assert.js",
      "../vendor/assets/javascripts/jquery.js",
      "../vendor/assets/javascripts/bootstrap.js",
      "../vendor/assets/javascripts/ajax_set.js",
      "../vendor/assets/javascripts/vue.js",
      "../vendor/assets/javascripts/lodash.js",
      "dest/**/*.js",
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'dest/**/*.js': preprocess,
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    browserify: {
      debug: true,
    },
  });
};
