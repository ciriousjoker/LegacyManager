const gulp = require('gulp');
const less = require('gulp-less');
const watch = require('gulp-watch');
const batch = require('gulp-batch');
const plumber = require('gulp-plumber');
const jetpack = require('fs-jetpack');
const bundle = require('./bundle');
const utils = require('./utils');

const projectDir = jetpack;
const srcDir = jetpack.cwd('./src');
const destDir = jetpack.cwd('./app');

// Search for files to transpile
const dirSearch = require('walkdir');

const glob = require("glob");
const path = require('path');
// options is optional


gulp.task('bundle', () => {
  console.log(srcDir.path(''));
  var files = glob.sync("**/*.js", { cwd: srcDir.path('./')});
  var promises = [];

  files.forEach((file) => {
    var oldpath = srcDir.path(file);
    var newpath = destDir.path(file);
    promises.push(bundle(oldpath, newpath));
    console.log(path.basename(srcDir.path(oldpath) + " >> " + path.basename(newpath)));
  });

  return Promise.all(promises);
});

gulp.task('less', () => {
  return gulp.src(srcDir.path('stylesheets/*.less'))
    .pipe(plumber())
    .pipe(less())
    .pipe(gulp.dest(destDir.path('stylesheets')));
});

gulp.task('environment', () => {
  const configFile = `config/env_${utils.getEnvName()}.json`;
  projectDir.copy(configFile, destDir.path('env.json'), { overwrite: true });
});

gulp.task('watch', () => {
  const beepOnError = (done) => {
    return (err) => {
      if (err) {
        utils.beepSound();
      }
      done(err);
    };
  };
  
  watch('src/**/*.less', batch((events, done) => {
    gulp.start('less', beepOnError(done));
  }));
});

gulp.task('build', ['bundle', 'less', 'environment']);
