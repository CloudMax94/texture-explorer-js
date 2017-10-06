var gulp = require('gulp')
var sass = require('gulp-ruby-sass')
var prefix = require('gulp-autoprefixer')
var minifyCSS = require('gulp-minify-css')
var sourcemaps = require('gulp-sourcemaps')
var rename = require('gulp-rename')
var uglify = require('gulp-uglify')
var watch = require('gulp-watch')
var gutil = require('gulp-util')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var watchify = require('watchify')
var browserify = require('browserify')
var babelify = require('babelify')
var aliasify = require('aliasify')

var mainBundler = watchify(browserify('./boot.js', {
  debug: true
}))
mainBundler.transform(babelify)
mainBundler.transform(aliasify, {
  aliases: {
    'electron': './lib/shims/electron',
    'fs': './lib/shims/fs'
  }
})
mainBundler.on('update', mainBundle)
mainBundler.on('log', gutil.log)

function mainBundle () {
  return mainBundler.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('boot.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify())
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./browser'))
    .on('end', function () { gutil.log('Browser built') })
}

gulp.task('sass-browser', function () {
  return sass('sass/style.scss', {sourcemap: true, style: 'compact'})
    .on('error', function (err) {
      console.error('sass Error!', err.message)
    })
    .pipe(prefix('last 2 version', '> 1%'))
    .on('error', function (err) {
      console.error('prefixer Error!', err.message)
    })
    .pipe(minifyCSS({}))
    .on('error', function (err) {
      console.error('minify Error!', err.message)
    })
    .pipe(rename('style.css'))
    .pipe(sourcemaps.write('.', {sourceRoot: 'sass'}))
    .pipe(gulp.dest('./browser/assets/css'))
})

gulp.task('watch-browser', ['sass-browser'], function () {
  mainBundle()
  var pattern
  pattern = ['./assets/**/*.*', './favicon.ico', 'FileSaver.min.js']
  gulp.src(pattern, {base: './'})
    .pipe(watch(pattern))
    .pipe(gulp.dest('./browser'))

  gulp.watch('./sass/**/*.scss', ['sass-browser'])
})

gulp.task('default', ['watch-browser'])
