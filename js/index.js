const DESKTOP_MQ = '(min-width: 900px)',
      PARALLAX_SUPPORTED = CSS.supports('transform-style', 'preserve-3d');

// Ensure we have Intersection Observer, otherwise load a polyfill
const IObserverReady = new Promise(r => {
  if ('IntersectionObserver' in window)
    r();
  else {
    const el = document.createElement('script');
    el.src = 'https://polyfill.io/v2/polyfill.min.js?features=IntersectionObserver';
    el.onload = r;
    document.head.appendChild(el);
  }
});

window.AppState = {
  parallaxEnabled: false,
  /**
   * Currently opened overlay element,
   * clicking it should close the overlay
   * @type {?Element}
   */
  openedOverlay: null,
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
  const textContainers = document.querySelectorAll('section .text-container');
  textContainers.forEach(container => {
    const expandable = container.querySelector('.expandable'),
          toggle = container.querySelector('.text-toggle');
    toggle.addEventListener('change', () => {
      const expanded = toggle.checked;
      if (expanded) {
        const parentSectionId = expandable.closest('section').id;
        // Add entry to history so we can close this on back navigation
        window.AppState.openedOverlay = expandable;
        history.pushState({}, document.title, `?section=${parentSectionId}`);
        expandable.setAttribute('data-section', parentSectionId);
        expandable.addEventListener('click', function clickHandler(e) {
          if (e.target === expandable) {
            // Remove the history entry and reset state
            if (window.AppState.openedOverlay) {
              window.AppState.openedOverlay = null;
              history.back();
            }
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
IObserverReady.then(() => {
  function callback(entries) {
    entries.forEach(entry => {
      const sectionName = entry.target.id;
      if (entry.intersectionRatio >= 0.6) {
        entry.target.classList.add('active');
        document.querySelector(`a[href="#${sectionName}"]`).classList.add('active');
      } else {
        entry.target.classList.remove('active');
        document.querySelector(`a[href="#${sectionName}"]`).classList.remove('active');
      }
      // Remove out-of-screen sections from display
      if (entry.intersectionRatio == 0 || entry.intersectionRatio) {
        const heroImages = document.querySelectorAll(`#${sectionName} .hero-image`);
        heroImages.forEach(image => image.classList.toggle('hide-on-desktop', !entry.intersectionRatio));
      }
    });
  }
  const IObserver = new IntersectionObserver(callback, {
    root: document.body,
    threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    rootMargin: '96px 0px 0px 0px'
  });
  const sectionsList = document.querySelectorAll('section');
  sectionsList.forEach(section => IObserver.observe(section));
  const navLinksList = document.querySelectorAll('nav a');
  navLinksList.forEach(el => el.classList.add('upgraded'));
});

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
});

// Close navigation drawer on click outside (mobile)
(() => {
  const toggle = document.querySelector('#nav-toggle');
  toggle.addEventListener('change', () => {
    const handler = e => {
      if (!e.target.closest('nav') && !e.target.closest('label[for="nav-toggle"]')) {
        toggle.checked = false;
        window.removeEventListener('click', handler, { passive: true })
      }
    };
    if (toggle.checked)
      window.addEventListener('click', handler, { passive: true });
    else
      window.removeEventListener('click', handler, { passive: true });
  });
})();

// Handle back navigation
(() => {
  window.onpopstate = e => {
    // Check state for open overlays and if there is one, close it
    if (window.AppState.openedOverlay) {
      const overlay = window.AppState.openedOverlay;
      window.AppState.openedOverlay = null;
      // App is structured so clicking this element should close the overlay
      overlay.click();
    }
  }
})();

// // Add phone parallax effect if supported
(() => {
  if (!(PARALLAX_SUPPORTED && 'DeviceOrientationEvent' in window))
    // Phone parallax not supported, abort
    return;
  function loadPhoneParallax() {
    const script = document.createElement('script');
    script.setAttribute('src', 'js/phone-parallax.js');
    script.setAttribute('defer', true);
    document.head.appendChild(script);
  }
  if (!window.matchMedia(DESKTOP_MQ).matches)
    IObserverReady.then(() => loadPhoneParallax());
  else
    window.addEventListener('resize', function handleResize() {
      if (!window.matchMedia(DESKTOP_MQ).matches) {
        IObserverReady.then(() => loadPhoneParallax());
        window.removeEventListener('resize', handleResize);
      }
    });
})();