// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var sass = require('gulp-ruby-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var cssmin = require('gulp-cssmin');
var autoprefixer = require('gulp-autoprefixer');
var spritesmith = require('gulp.spritesmith');
// Lint Task
gulp.task('lint', function () {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
//sprites png
gulp.task('sprite', function () {
    var spriteData = gulp.src('images/*.png').pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.css'
    }));
    return spriteData.pipe(gulp.dest('images/sprite/'));
});
// Compile Our Sass
gulp.task('sass', function () {
    return sass('scss/*.scss')
        .on('error', sass.logError)
        .pipe(gulp.dest('css'));
});
// Autoprefix
gulp.task('autoprefixer', function () {
    return gulp.src('css/*.css')
        .pipe(autoprefixer({
            browsers: ['>1%'],
            cascade: true
        }))
        .pipe(gulp.dest('css'));
});
// Concatenate & Minify JS
gulp.task('scripts', function () {
    return gulp.src(['js/vendor/*.js', 'js/*.js'])
        .pipe(concat('scripts.js'))
        .pipe(gulp.dest('js/build'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(uglify().on('error', function(e){
            console.log(e);
         }))
        .pipe(gulp.dest('dist'));
});
//Minify Css
gulp.task('cssmin', function () {
    gulp.src('css/*.css')
        .pipe(concat('style.css'))
        .pipe(gulp.dest('css/build'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(cssmin())
        .pipe(gulp.dest('dist'));
});

// Watch Files For Changes
gulp.task('watch', function () {
    gulp.watch('scss/*.scss', ['sass']);
});

// Default Task
gulp.task('default', ['watch']);