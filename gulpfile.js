const gulp = require('gulp'),
      babel = require('gulp-babel'),
      imagemin = require('gulp-imagemin'),
      cleanCss = require('gulp-clean-css'),
      htmlmin = require('gulp-htmlmin'),
      responsive = require('gulp-responsive'),
      replace = require('gulp-replace'),
      del = require('del');

const OUTPUT_PATH = './dist';


/* Misc functions */

gulp.task('cleanup', () => del(OUTPUT_PATH));

function copyMisc() {
  // Add things like CDATA to this array if needed
  return gulp.src(['favicon.ico', 'manifest.json'], { base: './' })
    .pipe(gulp.dest(OUTPUT_PATH));
}
copyMisc.displayName = 'copy-files';
copyMisc.description = 'Copying miscellaneous uncompilable files';

// It's very long process and results are the same for both legacy and modern, so run it only once
function optimiseImages() {
  return gulp.src(['**/*.{jpg,jpeg,png,svg,gif}', '!node_modules/**/*.*'], { base: './' })
    .pipe(responsive({
      'images/icons/500.png': [
        {
          width: 500
        }, {
          width: 432,
          rename: { basename: '432' }
        }, {
          width: 192,
          rename: { basename: '192' }
        }, {
          width: 144,
          rename: { basename: '144' }
        }, {
          width: 48,
          rename: { basename: '48' }
        }
      ],
      'images/*-sign.png': [
        {
          width: 400
        }, {
          width: 200,
          rename: { suffix: '-200px' }
        }, {
          width: 100,
          rename: { suffix: '-100px' }
        },
      ],
      'images/layered/*.png': [
        {
          width: 3840
        }, {
          width: 2560,
          rename: { suffix: '-2560px' }
        }, {
          width: 1080,
          rename: { suffix: '-1080px' }
        }, {
          width: 720,
          rename: { suffix: '-720px' }
        }
      ]
    }, {
      errorOnUnusedImage: false,
      passThroughUnused: true,
      errorOnEnlargement: false,
      silent: true
    }))
    .pipe(imagemin([
      imagemin.svgo(),
      imagemin.optipng({
        optimizationLevel: 2,
        paletteReduction: false,
        colorTypeReduction: false
      }),
      imagemin.jpegtran(),
      imagemin.gifsicle()
    ]))
    .pipe(gulp.dest(OUTPUT_PATH));
}
optimiseImages.displayName = 'optimise-images';
optimiseImages.description = 'Optimising images';


/* Compiling/minifying */

function css() {
  return gulp.src('css/*.css', { base: './' })
    .pipe(cleanCss())
    .pipe(replace(/background-image: url\(..\/images\/layered\/img(\d)-layer(\d).png\);/g, (match, p1, p2) => {
      const imageSetConfig = 
      `
        url(../images/layered/img${p1}-layer${p2}.png) 2x,
        url(../images/layered/img${p1}-layer${p2}-2560px.png) 1.5x,
        url(../images/layered/img${p1}-layer${p2}-1920px.png) 1x,
        url(../images/layered/img${p1}-layer${p2}-720px.png) 0.5x
      `;
      return `
        ${match}
        background-image: image-set(
          ${imageSetConfig}
        );
        background-image: -webkit-image-set(
          ${imageSetConfig}
        );`;
    }))
    .pipe(gulp.dest(OUTPUT_PATH));
}
css.displayName = 'css';
css.description = 'Minifying CSS and adding responsive images';

function js() {
  return gulp.src('js/*.js', { base: './' })
    .pipe(babel({
      presets: [
        ['@babel/preset-env', {
          useBuiltIns: 'entry'
        }],
        ['minify']
      ]
    }))
    .pipe(gulp.dest(OUTPUT_PATH));
}
js.displayName = 'js';
js.description = 'Minifying and compiling JS for 2 latest versions of major browsers';

function html() {
  return gulp.src('*.html', { base: './' })
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(replace(/<img (.+|\s)?src="images\/layered\/img(\d)-full\.png"([^>]+|\s)?>/g, (_, p1, p2, p3) => `
      <img ${p1 ? p1 : ''} src="images/layered/img${p2}-full.png ${p3 ? p3 : ''}
        srcset="
          images/layered/img${p2}-full.png 2x
          images/layered/img${p2}-full-2560px.png 1.5x
          images/layered/img${p2}-full-1920px.png 1x
          images/layered/img${p2}-full-720px.png 0.5x">
    `))
    .pipe(replace(/<img (.+|\s)?src="images\/([^-]+)-sign\.png"([^>]+|\s)?>/g, (_, p1, p2, p3) => `
      <img ${p1 ? p1 : ''} src="images/${p2}-sign.png ${p3 ? p3 : ''}
        srcset="
          images/${p2}-sign.png 2x
          images/${p2}-sign-200px.png 1x
          images/${p2}-sign-100px.png 0.5x">
    `))
    .pipe(gulp.dest(OUTPUT_PATH));
}
html.displayName = 'html';
html.description = 'Minifying HTML and adding responsive images';

gulp.task('minify', gulp.parallel(css, js, html));

gulp.task('default', gulp.series('cleanup', gulp.parallel('minify', optimiseImages, copyMisc)));