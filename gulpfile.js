var gulp        = require('gulp'),
    sass        = require('gulp-ruby-sass'),
    prefix      = require('gulp-autoprefixer'),
    minifyCSS   = require('gulp-minify-css'),
    sourcemaps  = require('gulp-sourcemaps'),
    rename      = require("gulp-rename"),
    uglify      = require('gulp-uglify'),
    concat      = require('gulp-concat'),
    watch       = require('gulp-watch'),
    gutil       = require('gulp-util'),
    source      = require('vinyl-source-stream'),
    buffer      = require('vinyl-buffer'),
    watchify    = require('watchify'),
    browserify  = require('browserify'),
    babelify    = require("babelify"),
    aliasify    = require('aliasify');

var mainBundler = watchify(browserify('./boot.js', {
    debug: true
}));
mainBundler.transform(babelify);
mainBundler.transform(aliasify, {
    aliases: {
        "cm-tree-view": "cm-tree-view/browser",
        "remote":       "./lib/shims/remote",
        //"./worker":     "./lib/shims/worker",
        "fs":           "./lib/shims/fs"
    },
});
//mainBundler.exclude('./lib/contextmenu.js');
mainBundler.on('update', mainBundle);
mainBundler.on('log', gutil.log);

function mainBundle() {
    return mainBundler.bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('boot.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
                .on('error', gutil.log)
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
    pattern = ['./assets/**/*.*', './favicon.ico', 'FileSaver.min.js'];
    gulp.src(pattern, {base: './'})
        .pipe(watch(pattern))
        .pipe(gulp.dest('./browser'));
});

gulp.task('watch-sass', function() {
    gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('watch', ['watch-sass', 'watch-browser'], function() {
});

gulp.task('default', ['watch']);
