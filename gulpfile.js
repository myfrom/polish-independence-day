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
      'images/icons/500.png': [{
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
      }]/* ,
      'images/setups/*.png': [{
        width: 200
      }, {
        width: 300,
        rename: { suffix: '-300px' }
      }, {
        width: 400,
        rename: { suffix: '-400px' }
      }, {
        width: 600,
        rename: { suffix: '-600px' }
      }],
      'images/features/frame.png': [{
        width: 200
      }, {
        width: 300,
        rename: { suffix: '-300px' }
      }, {
        width: 400,
        rename: { suffix: '-400px' }
      }, {
        width: 600,
        rename: { suffix: '-600px' }
      }],
      'images/features/*.png': [{
        width: 180
      }, {
        width: 270,
        rename: { suffix: '-270px' }
      }, {
        width: 360,
        rename: { suffix: '-360px' }
      }, {
        width: 540,
        rename: { suffix: '-540px' }
      }],
      'images/team/creators/*.{png,jpeg,jpg}': [{
        width: 100
      }, {
        width: 200,
        rename: { suffix: '-200px' }
      }],
      'images/team/contributors/*.{png,jpeg,jpg}': [{
        width: 32
      }, {
        width: 64,
        rename: { suffix: '-64px' }
      }],
      'images/background-big.png': [{
        width: 1920,
      }, {
        width: 960,
        rename: { suffix: '-960px '}
      }, {
        width: 1280,
        rename: { suffix: '-1280px '}
      }, {
        width: 2560,
        rename: { suffix: '-2560px '}
      }, {
        width: 3840,
        rename: { suffix: '-3840px '}
      }],
      'images/background-phone.png': [{
        width: 720,
      }, {
        width: 460,
        rename: { suffix: '-460px '}
      }, {
        width: 1080,
        rename: { suffix: '-1080px '}
      }, {
        width: 1440,
        rename: { suffix: '-1440px '}
      }] */
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
    .pipe(gulp.dest(OUTPUT_PATH));
}
css.displayName = 'css';
css.description = 'Minifying CSS';

function js() {
  return gulp.src('js/*.js', { base: './' })
    .pipe(babel({
      presets: [
        ['@babel/preset-env', {
          targets: 'last 2 major versions, not ie < 11, not safari < 10',
          useBuiltIns: 'entry'
        }],
        ['minify', {
          mangle: {
            exclude: ['scrollCounter']
          }
        }]
      ]
    }))
    .pipe(gulp.dest(OUTPUT_PATH));
}
js.displayName = 'js';
js.description = 'Minifying and compiling JS for 2 latest versions of major browsers';

function html() {
  function getPlaceholderImageTag(input) {
    const inputSearch = input.match(/src="([^\.]*\.([^"]*))"/),
          imgSrc = inputSearch[1],
          imgExt = inputSearch[2],
          srcIndex = inputSearch.index + 5,
          srcLength = imgSrc.length;
    let base64String;
    sharp(imgSrc)
      .resize(5, null)
      .toBuffer((_, buffer) => base64String = buffer.toString('base64'));
    deasync.loopWhile(() => !base64String);
    return input.substr(0, srcIndex) +
      `data:image/${imgExt};base64,` +
      base64String +
      input.substr(srcIndex + srcLength) +
      ' data-lazyload';
  };

  return gulp.src('*.html', { base: './' })
    // .pipe(replace(/<(img src="images\/logo-512px\.png" [^>]*)>/, (_, p1) => `
    //   <noscript class="lazyload-image">
    //     <${p1}
    //     srcset="
    //       images/logo-52px.png 52w,
    //       images/logo-104px.png 104w,
    //       images/logo-64px.png 64w,
    //       images/logo-128px.png 128w,
    //       images/logo-70px.png 70w,
    //       images/logo-140px.png 140w"
    //     sizes="
    //       (max-width: 700px) 52px,
    //       (min-width: 700px) and (max-width: 900px) 64px,
    //       (min-width: 900px) 70px">
    //   </noscript>
    //   <${getPlaceholderImageTag(p1)}>
    // `))
    // .pipe(replace(/<(img src="(images\/setups[^\.]*)\.png"[^>]*)>/g, (_, p1, p2) => `
    //   <noscript class="lazyload-image">
    //     <${p1}
    //     srcset="
    //       ${p2}.png 200w,
    //       ${p2}-300px.png 300w,
    //       ${p2}-400px.png 400w,
    //       ${p2}-600px.png 600w"
    //     sizes="
    //       (min-width: 1920px) 300px,
    //       200px">
    //   </noscript>
    //   <${getPlaceholderImageTag(p1)}>
    // `))
    // .pipe(replace(/<(img src="images\/features\/frame\.png"[^>]*)>/g, (_, p1) => `
    //   <noscript class="lazyload-image">
    //     <${p1}
    //     srcset="
    //       images/features/frame.png 200w,
    //       images/features/frame-300px.png 300w,
    //       images/features/frame-400px.png 400w,
    //       images/features/frame-600px.png 600w"
    //     sizes="
    //       (min-width: 1920px) 300px,
    //       200px">
    //   </noscript>
    //   <${getPlaceholderImageTag(p1)}>
    // `))
    // .pipe(replace(/<(img src="(images\/features\/(?!frame)[^.]*)\.png"[^>]*)>/g, (_, p1, p2) => `
    //   <noscript class="lazyload-image">
    //     <${p1}
    //     srcset="
    //       ${p2}.png 180w,
    //       ${p2}-360px.png 360w,
    //       ${p2}-270px.png 270w,
    //       ${p2}-540px.png 540w"
    //     sizes="
    //       (min-width: 1920px) 270px,
    //       180px">
    //   </noscript>
    //   <${getPlaceholderImageTag(p1)}>
    // `))
    // .pipe(replace(/<(img src="(images\/team\/creators[^\.]*)\.(png|jpeg|jpg)"[^>]*)>/g, (_, p1, p2, p3) => `
    //   <noscript class="lazyload-image">
    //     <${p1}
    //     srcset="
    //       ${p2}.${p3} 100w,
    //       ${p2}-200px.${p3} 200w"
    //     sizes="100px">
    //   </noscript>
    //   <${getPlaceholderImageTag(p1)}>
    // `))
    // .pipe(replace(/<(img src="(images\/team\/contributors[^\.]*)\.(png|jpeg|jpg)"[^>]*)>/g, (_, p1, p2, p3) => `
    //   <noscript class="lazyload-image">
    //     <${p1}
    //     srcset="
    //       ${p2}.${p3} 32w,
    //       ${p2}-64px.${p3} 64w"
    //     sizes="32px">
    //   </noscript>
    //   <${getPlaceholderImageTag(p1)}>
    // `))
    // .pipe(replace('background-image: url(images/background-big.png);', match => {
    //   const imageSetConfig = 
    //   `
    //     url(images/background-big.png) 1920w,
    //     url(images/background-big-960px.png) 960w,
    //     url(images/background-big-1280px.png) 1280w,
    //     url(images/background-big-2560px.png) 2560w,
    //     url(images/background-big-3840px.png) 3840w
    //   `;
    //   return `
    //     ${match}
    //     background-image: image-set(
    //       ${imageSetConfig}
    //     );
    //     background-image: -webkit-image-set(
    //       ${imageSetConfig}
    //     );`;
    // }))
    // .pipe(replace('background-image: url(images/background-phone.png);', match => {
    //   const imageSetConfig = 
    //   `
    //     url(images/background-phone.png) 720w,
    //     url(images/background-phone-460px.png) 460w,
    //     url(images/background-phone-1080px.png) 1080w,
    //     url(images/background-phone-1440px.png) 1440w
    //   `;
    //   return `
    //     ${match}
    //     background-image: image-set(
    //       ${imageSetConfig}
    //     );
    //     background-image: -webkit-image-set(
    //       ${imageSetConfig}
    //     );`;
    // }))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(gulp.dest(OUTPUT_PATH));
}
html.displayName = 'html';
html.description = 'Minifying HTML and adding responsive images';

gulp.task('minify', gulp.parallel(css, js, html));

gulp.task('default', gulp.series('cleanup', gulp.parallel('minify', optimiseImages, copyMisc)));