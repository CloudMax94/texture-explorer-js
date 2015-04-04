var gulp        = require('gulp'),
    sass        = require('gulp-ruby-sass'),
    prefix      = require('gulp-autoprefixer'),
    minifyCSS   = require('gulp-minify-css'),
    sourcemaps  = require('gulp-sourcemaps'),
    rename      = require("gulp-rename"),
    uglify      = require('gulp-uglify'),
    concat      = require('gulp-concat'),
    watch       = require('gulp-watch'),
    jade        = require('jade'),
    gulpJade    = require('gulp-jade'),
    gutil       = require('gulp-util'),
    source      = require('vinyl-source-stream'),
    buffer      = require('vinyl-buffer'),
    watchify    = require('watchify'),
    browserify  = require('browserify'),
    babelify    = require("babelify"),
    aliasify    = require('aliasify');

var mainBundler = watchify(browserify('./boot.js', watchify.args));
mainBundler.transform(babelify);
mainBundler.transform(aliasify, {
    aliases: {
        "remote": "./shims/remote",
        "fs": "./shims/fs",
        "./lib/contextmenu": "./shims/contextmenu",
    },
});
mainBundler.exclude('./lib/contextmenu.js');
mainBundler.on('update', mainBundle);
mainBundler.on('log', gutil.log);

function mainBundle() {
    return mainBundler.bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('boot.js'))
            .pipe(buffer())
            .pipe(uglify())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./browser'));
}

gulp.task('sass', function() {
    return sass('sass/style.scss', {sourcemap: true, style: 'compact'})
        .on('error', function (err) {
            console.error('sass Error!', err.message);
        })
        .pipe(prefix("last 2 version", "> 1%"))
        .on('error', function (err) {
            console.error('prefixer Error!', err.message);
        })
        .pipe(minifyCSS({}))
        .on('error', function (err) {
            console.error('minify Error!', err.message);
        })
        .pipe(rename("style.css"))
        .pipe(sourcemaps.write('.', {sourceRoot: 'sass'}))
        .pipe(gulp.dest('./assets/css'));
});

gulp.task('watch-browser', function() {
    mainBundle();
    var pattern;
    pattern = ['./main.jade'];
    gulp.src(pattern)
        .pipe(watch(pattern))
        .pipe(rename("index.html"))
        .pipe(gulpJade({
            jade: jade,
            pretty: true,
            locals: {
                'browser': true
            }
        }))
        .pipe(gulp.dest('browser'));
    pattern = ['./assets/**/*.*', './favicon.ico', 'FileSaver.min.js'];
    gulp.src(pattern, {base: './'})
        .pipe(watch(pattern))
        .pipe(gulp.dest('./browser'));
});

gulp.task('watch-sass', function() {
    gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('default', ['watch-sass', 'watch-browser']);