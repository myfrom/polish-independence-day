const DESKTOP_MQ = '(min-width: 900px)',
      PARALLAX_SUPPORTED = CSS.supports('transform-style: preserve-3d') && ('IntersectionObserver' in window);

window.AppState = {
  parallaxEnabled: false
};

function doubleRAF(fun) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fun);
  })
}

function waitForTransition(element, listenToChild) {
  return new Promise(r => {
    element.addEventListener('transitionend', function handleEvent(e) {
      if (listenToChild || e.target === element) {
        r();
        element.removeEventListener('transitionend', handleEvent);
      }
    });
  });
}

// Load our lazy CSS
(() => {
  const noscriptEl = document.querySelector('#lazyload-css');
  noscriptEl.insertAdjacentHTML('afterend', noscriptEl.textContent);
})();

// Fix 'more info' sections after parallax is added
(() => {
  history.replaceState({ section: null }, '', '');

  const textContainers = document.querySelectorAll('section .text-container');
  textContainers.forEach(container => {
    const expandable = container.querySelector('.expandable'),
          toggle = container.querySelector('.text-toggle');
    toggle.addEventListener('change', () => {
      const expanded = toggle.checked;
      if (expanded) {
        const parentSectionName = expandable.closest('section').id;
        expandable.setAttribute('data-section', parentSectionName);
        expandable.addEventListener('click', function clickHandler(e) {
          if (e.target === expandable) {
            toggle.click();
            expandable.removeEventListener('click', clickHandler, { passive: true });
            waitForTransition(expandable, true).then(() => {
              const parentSectionName = expandable.getAttribute('data-section');
              document.querySelector(`#${parentSectionName} .text-container`).appendChild(expandable);
              document.body.style.overflow = '';
              expandable.style.transform = '';
            });
            expandable.classList.remove('open');
          }
        }, { passive: true });
        document.body.style.overflow = 'hidden';
        window.AppState.parallaxEnabled &&
          (expandable.style.transform = `translateY(${document.body.scrollTop}px)`);
        expandable.classList.add('upgraded');
        document.body.appendChild(expandable);
        doubleRAF(() => expandable.classList.add('open'));
      }
    });
  });
})();

// Load parallax images
(() => {
  const containers = document.querySelectorAll('.image-lazyload');
  containers.forEach(noscriptEl => {
    noscriptEl.insertAdjacentHTML('afterend', noscriptEl.textContent);
    const previousSibling = noscriptEl.previousElementSibling;
    if (previousSibling.tagName === 'IMG') previousSibling.remove();
  });

  function reactToResize() {
    if (PARALLAX_SUPPORTED && window.matchMedia(DESKTOP_MQ).matches) {
      document.body.classList.add('upgraded-parallax');
      window.AppState.parallaxEnabled = true;
    } else {
      document.body.classList.remove('upgraded-parallax');
      window.AppState.parallaxEnabled = false;
    }
  }

  window.addEventListener('resize', reactToResize);
  reactToResize();
})();

// Mark sections as active
(() => {
  if (!('IntersectionObserver' in window)) return;
  function callback(entries) {
    entries.forEach(entry => {
      const sectionName = entry.target.id;
      if (entry.intersectionRatio >= 0.7) {
        entry.target.classList.add('active');
        document.querySelector(`a[href="#${sectionName}"]`).classList.add('active');
      } else {
        entry.target.classList.remove('active');
        document.querySelector(`a[href="#${sectionName}"]`).classList.remove('active');
      }
    });
  }
  const IObserver = new IntersectionObserver(callback, {
    root: document.body,
    threshold: [0, 0.25, 0.75, 1]
  });
  const sectionsList = document.querySelectorAll('section');
  sectionsList.forEach(section => IObserver.observe(section));
  const navLinksList = document.querySelectorAll('nav a');
  navLinksList.forEach(el => el.classList.add('upgraded'));
})();

// Passively listen for scroll to add waterfall effect
(() => {
  const header = document.querySelector('header');
  document.body.addEventListener('scroll', () => {
    if (document.body.scrollTop > 32)
      header.classList.add('shadow');
    else
      header.classList.remove('shadow');
  }, { passive: true });
  header.classList.add('waterfall');
})();