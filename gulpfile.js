const gulp = require('gulp');

const runSequence = require('run-sequence');

// const glob = require('glob');
const path = require('path');

const del = require('del');

const rollup = require('rollup');
const through = require('through2');

const workboxBuild = require('workbox-build');

const eslint = require('gulp-eslint');

const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');

const uglify = composer(uglifyes, console);

const BUILD_DIR = 'build/';

function dependencies() {
  
  let deps = new Set([]);
  
  let stream = through.obj(async function(file, enc, callback) {
    
    let bundle = await rollup.rollup({
      input: file.path
    });
    
    bundle.modules.forEach((module) => {
      module.dependencies.forEach((dependency) => {
        let depPath = path.relative(process.cwd(), dependency);
        if (!deps.has(depPath)) {
          deps.add(depPath);
        }
      });
    });
  
    callback();
  },
  function (callback) {
    let src = gulp.src(Array.from(deps), {base: '.'});
    src.on("data", (file) => {
      // eslint-disable-next-line no-invalid-this
      this.push(file);
    });
    src.on("finish", () => {
      callback();
    });
  });
  
  return stream;
}

gulp.task('default', (callback) => {
  runSequence('copy', 'sw', callback);
});

gulp.task('copy', ['copy:root', 'copy:src', 'copy:images', 'copy:deps']);

gulp.task('full', (callback) => {
  runSequence('test', 'clean:build', 'default', callback);
});

gulp.task('clean:build', function() {
  return del([BUILD_DIR]);
});

gulp.task('copy:root', function() {
  return gulp.src([
    'index.html',
    'manifest.json',
    'node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js',
    'favicon.ico'
  ], {base: '.'})
  .pipe(gulp.dest(`${BUILD_DIR}/`));
});

gulp.task('copy:src', function() {
  return gulp.src([
    'src/**'
  ], {base: '.'})
  .pipe(gulp.dest(`${BUILD_DIR}/`));
});

gulp.task('copy:images', function() {
  return gulp.src([
    'images/**'
  ], {base: '.'})
  .pipe(gulp.dest(`${BUILD_DIR}/`));
});

gulp.task('copy:deps', function() {
  
  // let deps = await dependencies();
  
  return gulp.src('src/**.js', {base: '.'})
  .pipe(dependencies())
  .pipe(uglify({}))
  .pipe(gulp.dest(`${BUILD_DIR}/`));
});

gulp.task('copy:sw', function() {
  return gulp.src([
    'sw.js',
    'node_modules/idb-keyval/idb-keyval.js'
  ], {base: '.'})
  .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('sw', ['sw:manifest', 'copy:sw']);

gulp.task('sw:manifest', function() {
  
  return workboxBuild.generateFileManifest({
    manifestDest: `${BUILD_DIR}/sw_manifest.js`,
    globDirectory: `${BUILD_DIR}/`,
    globPatterns: ['**/*.{html,js,mjs,css}'],
    globIgnores: [
      'sw*.js'
    ],
    format: 'iife'
  });
});

gulp.task('test', ['lint']);

gulp.task('lint', () => {
  return gulp.src([
    '**/*.js',
    '!node_modules/**',
    '!build/**'
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());
});