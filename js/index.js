const DESKTOP_MQ = '(min-width: 900px)';

// Load our lazy CSS
(() => {
  const noscriptEl = document.querySelector('#lazyload-css');
  noscriptEl.insertAdjacentHTML('afterend', noscriptEl.textContent);
})();

// Improve 'more info' sections
// (() => {
//   const textContainers = document.querySelectorAll('section .text-container');
//   textContainers.forEach(container => {
//     const expandable = container.querySelector('.expandable'),
//           toggle = container.querySelector('.text-toggle'),
//           overview = container.querySelector('.overview');
//     toggle.addEventListener('change', () => {
//       const expanded = toggle.checked;
//       if (expanded) {
//         overview.style.transition = '';
//         overview.style.transform = 'none';
//       } else {
//         waitForTransition(expandable, true).then(() => {
//         overview.style.transition = 'transform 150ms ease-in-out';
//           overview.style.transform = '';
//         });
//       }
//     });
//   });
// })();

// Load parallax images
(() => {
  async function loadParallax() {
    const containers = document.querySelectorAll('.image-lazyload');
    containers.forEach(noscriptEl => {
      noscriptEl.insertAdjacentHTML('afterend', noscriptEl.textContent);
      const previousSibling = noscriptEl.previousElementSibling;
      if (previousSibling.tagName === 'IMG') previousSibling.remove();
    });
  }

  if (window.matchMedia(DESKTOP_MQ).matches)
    loadParallax();
  else
    window.addEventListener('resize', function reactToResize() {
      if (window.matchMedia(DESKTOP_MQ).matches) {
        loadParallax();
        window.removeEventListener('resize', reactToResize);
      }
    });
})();