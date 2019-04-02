// Import necessary styles
const style = document.createElement('link');
style.setAttribute('rel', 'stylesheet');
style.setAttribute('href', 'css/phone-parallax.css');
style.setAttribute('media', '(max-width: 900px)');
document.head.appendChild(style);

(() => {

  // Setup for mobile parallax

  let template;
  function addClickListeners() {
    const heroList = document.querySelectorAll('.hero-image.l1');
    heroList.forEach(image => {
      const section = image.closest('section');
      const button = document.createElement('button');
      button.classList.add('phone-parallax-btn');
      button.innerHTML = `<span class="btn-dot"></span> Powiększ obraz`;
      button.setAttribute('data-section', section.id);
      button.addEventListener('click', e => {
        if (window.AppState.parallaxEnabled) return;
        if (window.AppState.openedOverlay) {
          console.warn("Trying to open an overlay while one's already open", window.AppState.openedOverlay);
          return;
        };
        const overlayNode = template.content.cloneNode(true);
        document.body.appendChild(overlayNode);
        const overlay = document.querySelector('#phone-parallax-overlay');
        const currentSection = e.target.getAttribute('data-section');
        overlay.classList.add('closed', currentSection);
        const closeBtn = overlay.querySelector('#ppo-close-btn');
        closeBtn.addEventListener('click', () => {
          stopMobileParallax();
          // Remove the history entry and reset state
          if (window.AppState.openedOverlay) {
            window.AppState.openedOverlay = null;
            history.back();
          }
          overlay.addEventListener('transitionend', () => overlay.remove());
          overlay.classList.add('closed');
        });
        window.AppState.openedOverlay = closeBtn;
        doubleRAF(() => overlay.classList.remove('closed'));
        startMobileParallax();
        history.pushState({}, document.title, `?picture=${currentSection}`);
      });
      image.appendChild(button);
    });
    template = document.createElement('template');
    template.innerHTML = `
      <div id="phone-parallax-overlay">
        <div class="parallax">
          <div class="l3"></div>
          <div class="l2"></div>
          <div class="l1"></div>
        </div>
        <div id="ppo-close-btn">X</div>
      </div>
    `;
    document.body.appendChild(template);
  }


  // Turn on buttons to expand images when sure that device supports motion

  let initialSet = false;
  let initialAlpha, initialBeta, initialGamma;
  const reactToFirstChange = e => {
    const { alpha, beta, gamma } = e;
    if (initialSet && (alpha != initialAlpha || beta != initialBeta || gamma != initialGamma)) {
      addClickListeners();
      window.removeEventListener(
        'DeviceOrientationAbsoluteEvent' in window ? deviceorientationabsolute : 'deviceorientation',
        reactToFirstChange);
      return;
    }
    if (!initialSet) {
      initialAlpha = alpha
      initialBeta = beta;
      initialGamma = gamma;
      initialSet = true;
    }
  };
  if ('DeviceOrientationAbsoluteEvent' in window) {
    window.addEventListener('deviceorientationabsolute', reactToFirstChange);
  } else {
    window.addEventListener('deviceorientation', reactToFirstChange);
  }


  // Actually handle the effect

  let initialPosition = {}, position = {}, effectEnabled = false;

  function parallaxListeners(e) {
    let { alpha, beta, gamma } = e;
    if (!initialPosition.isSet) {
      initialPosition = { alpha, beta, gamma };
      initialPosition.isSet = true;
      return;
    }
    // Normalize values
    beta > 90 && (beta = 90);
    beta < -90 && (beta = -90);
    position = { alpha, beta, gamma };  
  }

  function startMobileParallax() {
    effectEnabled = true;
    initialPosition.isSet = false;
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', parallaxListeners);
    } else {
      console.warn('Mobile parallax might not work correctly - units don\'t have to be absolute!')
      window.addEventListener('deviceorientation', parallaxListeners);
    }
    requestAnimationFrame(function raf() {
      let { alpha, beta, gamma } = position;
      // Normalize values
      beta > 90 && (beta = 90);
      beta < -90 && (beta = -90);

      // We need to swap x with y in landscape, because values are relative to portrait
      const orientation = (screen.msOrientation || screen.mozOrientation || screen.orientation || {}).type,
            isLandscape = orientation == 'landscape-primary' || orientation == 'landscape-secondary',
            x = isLandscape ? initialPosition.beta - beta : initialPosition.gamma - gamma,
            y = isLandscape ? initialPosition.gamma - gamma : initialPosition.beta - beta;

      const l1 = document.querySelector('#phone-parallax-overlay .l1'),
            l2 = document.querySelector('#phone-parallax-overlay .l2'),
            l3 = document.querySelector('#phone-parallax-overlay .l3');

      l1.style.transform = `translate(${x*0.2}px, ${y*0.2}px)`;
      l2.style.transform = `translate(${x*0.6}px, ${y*0.6}px)`;
      l3.style.transform = `translate(${x}px, ${y}px)`;

      effectEnabled && requestAnimationFrame(raf);
    });
  }

  function stopMobileParallax() {
    effectEnabled = false;
    if ('DeviceOrientationAbsoluteEvent' in window) {
      window.removeEventListener('deviceorientationabsolute', parallaxListeners);
    } else {
      window.removeEventListener('deviceorientation', parallaxListeners);
    }
  }

})();