var gulp = require('gulp')
var sass = require('gulp-ruby-sass')
var prefix = require('gulp-autoprefixer')
var minifyCSS = require('gulp-minify-css')
var sourcemaps = require('gulp-sourcemaps')
var rename = require('gulp-rename')
var watch = require('gulp-watch')

gulp.task('sass-browser', function () {
  return sass('src/sass/style.scss', {sourcemap: true, style: 'compact'})
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
    .pipe(gulp.dest('./dist/browser'))
})

gulp.task('watch-browser', ['sass-browser'], function () {
  var pattern
  pattern = ['./src/static/**/*.*']
  gulp.src(pattern, {base: './src/static/'})
    .pipe(watch(pattern))
    .pipe(gulp.dest('./dist/browser'))
  gulp.watch('./src/sass/**/*.scss', ['sass-browser'])
})

gulp.task('default', ['watch-browser'])
