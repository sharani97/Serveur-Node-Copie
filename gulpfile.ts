/**
 * Created by Moiz.Kachwala on 08-06-2016.
 */

'use strict';

function done(cb) {
  cb();
}

const gulp = require('gulp'),
    del = require('del'),
    tsc = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    tsProject = tsc.createProject('tsconfig.json'),
    tslint = require('gulp-tslint'),
    concat = require('gulp-concat'),
    runSequence = require('run-sequence'),
    nodemon = require('gulp-nodemon'),
    gulpTypings = require('gulp-typings');

/**
 * Remove build directory.
 */
gulp.task('clean', (cb) => {
    return del(['dist'], cb);
});

/**
 * Build Express server
 */
gulp.task('build:server', function () {
    var tsProject = tsc.createProject('server/tsconfig.json');
    var tsResult = gulp.src('server/src/**/*.ts')
        .pipe(sourcemaps.init())
        .pipe(tsProject());
    return tsResult.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/server'));
});

/**
 * Lint all custom TypeScript files.
 */
gulp.task('tslint', () => {
    return gulp.src('server/src/**/*.ts')
        .pipe(tslint({
            formatter: 'prose'
        }))
        .pipe(tslint.report());
});


/**
 * Copy bin directory for www
 */
gulp.task('serverResources', () => {
    return gulp.src(['server/src/bin/**'])
        .pipe(gulp.dest('dist/server/bin'));
});


/**
 * Copy json for swagger
 */
gulp.task('swagCopy', () => {
    return gulp.src(['server/src/swagger/**'])
        .pipe(gulp.dest('dist/server/swagger'));
});

/**
 * Install typings for server and client.
 */
gulp.task('installTypings', function () {
    var stream = gulp.src(['./server/typings.json'])
        .pipe(gulpTypings(null)); //will install all typingsfiles in pipeline.
    return stream; // by returning stream gulp can listen to events from the stream and knows when it is finished.
});


/**
 * Copy all required libraries into build directory.
 */
/*
gulp.task('libs', () => {
    return gulp.src([
        'core-js/client/**',
        'zone.js/dist/zone.js',
        'reflect-metadata/Reflect.js',
        'reflect-metadata/Reflect.js.map',
        'systemjs/dist/system.src.js'
    ], { cwd: 'node_modules/**' }) 
        .pipe(gulp.dest('dist/client/libs'));
});*/

/**
 * Start the express server with nodemon
 */
gulp.task('start', function () {
    nodemon({
        script: 'dist/server/bin/www'
        , ext: 'html js'
        , ignore: ['ignored.js']
        , tasks: ['tslint']
    })
        .on('restart', function () {
            console.log('restarted!');
        });
});

/**
 * Build the project.
 * 1. Clean the build directory
 * 2. Build Express server
 * 3. Build the Angular app
 * 4. Copy the resources
 * 5. Copy the dependencies.
 */

gulp.task('build', function () {
    gulp.series('clean', 'build:server', 'serverResources', 'swagCopy', 'libs', done);
});

/**
 * Watch for changes in TypeScript, HTML and CSS files.
 */
gulp.task('watch', function () {
    gulp.watch(['server/src/**/*.ts'], ['build']).on('change', function (e) {
        console.log('TypeScript file ' + e.path + ' has been changed. Compiling.');
    });
});

/**
 * Build the project.
 * 1. Clean the build directory
 * 2. Build Express server
 * 3. Build the Angular app
 * 4. Copy the resources
 * 5. Copy the dependencies.
 */

gulp.task('build', 
    gulp.series('clean', 'build:server', 'serverResources', 'swagCopy', done)
);

gulp.task('default', 
    gulp.series('build:server', 'serverResources', 'swagCopy', 'watch', 'start', done)
);
