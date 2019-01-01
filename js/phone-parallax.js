(() => {
  let template;
  function addClickListeners() {
    const heroList = document.querySelectorAll('.hero-image.l1');
    heroList.forEach(image => {
      let imageIndex;
      const section = image.closest('section');
      const button = document.createElement('button');
      button.classList.add('phone-parallax-btn');
      button.innerText = 'Powiększ obraz';
      button.setAttribute('data-section', section.id);
      button.addEventListener('click', e => {
        if (window.AppState.parallaxEnabled) return;
        if (window.AppState.phoneParallaxOverlayOpen) return;
        const overlayNode = template.content.cloneNode(true);
        document.body.appendChild(overlayNode);
        const overlay = document.querySelector('#phone-parallax-overlay');
        const currentSection = e.target.getAttribute('data-section');
        overlay.classList.add('closed', currentSection);
        overlay.querySelector('#ppo-close-btn').addEventListener('click', e => {
          overlay.addEventListener('transitionend', () => overlay.remove());
          overlay.classList.add('closed');
        });
        doubleRAF(() => overlay.classList.remove('closed'));
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

  let initialSet = false;
  let initialAlpha, initialBeta, initialGamma;
  window.addEventListener('deviceorientation', function reactToFirstChange(e) {
    const { alpha, beta, gamma } = e;
    if (initialSet && (alpha != initialAlpha || beta != initialBeta || gamma != initialGamma)) {
      addClickListeners();
      window.removeEventListener('deviceorientation', reactToFirstChange);
      return;
    }
    if (!initialSet) {
      initialAlpha = alpha
      initialBeta = beta;
      initialGamma = gamma;
      initialSet = true;
    }
  });
})();