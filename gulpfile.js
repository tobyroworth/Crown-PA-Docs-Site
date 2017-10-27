const gulp = require('gulp');

const runSequence = require('run-sequence');

const glob = require('glob');
const path = require('path');

const del = require('del');

const rollup = require('rollup');

const workboxBuild = require('workbox-build');

const eslint = require('gulp-eslint');

const BUILD_DIR = 'build/';

async function dependencies() {
  
  let deps = await new Promise((resolve, reject) => {
    glob('src/**.js', {}, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  }).catch((err) => {
    console.error(err);
    return null;
  });
  
  if (!deps) {
    return null;
  }
  
  let seen = {};
  let modules = [];
  
  for (let i = 0; i < deps.length; i++) {
    
    let dep = deps[i];
    
    let bundle = await rollup.rollup({
      input: dep
    });
    
    bundle.modules.forEach((module) => {
      module.dependencies.forEach((dependency) => {
        if (!seen.hasOwnProperty(dependency)) {
          seen[dependency] = true;
          modules.push(path.relative(process.cwd(), dependency));
        }
      });
    });
  }
  
  return modules;
}

gulp.task('default', (callback) => {
  runSequence('copy', 'sw', callback);
});

gulp.task('copy', ['copy:root', 'copy:src', 'copy:deps']);

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
    'node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js'
  ], {base: '.'})
  .pipe(gulp.dest(`${BUILD_DIR}/`));
});

gulp.task('copy:src', function() {
  return gulp.src([
    'src/**'
  ], {base: '.'})
  .pipe(gulp.dest(`${BUILD_DIR}/`));
});

gulp.task('copy:deps', async function() {
  
  let deps = await dependencies();
  
  return gulp.src(deps, {base: '.'})
  .pipe(gulp.dest(`${BUILD_DIR}/`));
});

gulp.task('copy:sw', function() {
  return gulp.src([
    'sw.js',
    'node_modules/workbox-precaching/build/importScripts/workbox-precaching.prod.v2.1.0.js',
    'node_modules/idb-keyval/idb-keyval.js'
  ], {base: '.'})
  .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('sw', ['sw:manifest', 'copy:sw']);

gulp.task('sw:manifest', function() {
  
  workboxBuild.generateFileManifest({
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