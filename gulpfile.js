const gulp = require('gulp');

const runSequence = require('run-sequence');

const glob = require('glob');
const path = require('path');

const del = require('del');

const yarn = require('gulp-yarn');
const jeditor = require("gulp-json-editor");

const rollup = require('rollup');

const workboxBuild = require('workbox-build');

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
    return;
  });
  
  let seen = {};
  let modules = [];
  
  for (let i = 0; i < deps.length; i++) {
    
    let dep = deps[i];
    
    let bundle = await rollup.rollup({
      input: dep
    });
    
    bundle.modules.forEach((module) => {
      module.dependencies.forEach((dep) => {
        if (!seen.hasOwnProperty(dep)) {
          seen[dep] = true;
          modules.push(path.relative(process.cwd(), dep));
        }
      });
    });
  }
  
  return modules;
};

gulp.task('default', (callback) => {
  runSequence('copy', 'sw');
});

gulp.task('copy', ['copy:root', 'copy:src', 'copy:deps']);

gulp.task('full', (callback) => {
  runSequence('clean:build', 'default');
});

gulp.task('clean:build', function() {
  return del([BUILD_DIR]);
});

// gulp.task('yarn:deps', function() {
//   return gulp.src('package.json')
//     .pipe(jeditor(function(packageFile) {
//       packageFile.devDependencies = {};
//       return packageFile;
//     }))
//     .pipe(gulp.dest(BUILD_DIR))
//     .pipe(yarn({
//       production: true,
//       noLockfile: true
//     }))
//     .on('end', () => {
//       del([
//         `${BUILD_DIR}/package.json`,
//         `${BUILD_DIR}/yarn.lock`
//       ]);
//     });
// });

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
    globPatterns: ['**\/*.{html,js,mjs,css}'],
    globIgnores: [
      // 'node_modules\/**',
      // '**\/test\/**',
      // '**\/tests\/**',
      // '**\/example\/**',
      // '**\/examples\/**',
      // '**\/demo\/**',
      // '**\/demos\/**',
      // '**\/templates\/**',
      // '**\/patterns\/**',
      'sw*.js'
    ],
    format: 'iife'
  });
});