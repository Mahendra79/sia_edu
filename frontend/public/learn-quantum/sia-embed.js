// SIA Education integration for the Learn Quantum guide.
// Loaded before app.js. Keeps every SIA-specific behaviour out of the upstream
// files (app.js, styles.css) so new guide releases can be copied in unchanged.
(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const embedded = params.has('embedded') && window.parent !== window;

  // Upstream bug: opening the guide directly at #basics-1 renders nothing, because the
  // router thinks that lesson is already showing. It is the start page, so drop the hash.
  if (window.location.hash === '#basics-1') {
    history.replaceState(history.state, '', window.location.pathname + window.location.search);
  }

  const applyTheme = (theme) => {
    if (theme === 'dark' || theme === 'light') root.classList.toggle('theme-dark', theme === 'dark');
  };

  // Theme changes from the host page arrive as messages, so the guide never reloads.
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.data?.type !== 'sia-education-theme') return;
    applyTheme(event.data.theme);
  });

  if (embedded) {
    // Same-origin hosts can also be observed directly, which covers the moment
    // before the first message arrives.
    try {
      const hostRoot = window.parent.document.documentElement;
      applyTheme(hostRoot.getAttribute('data-theme'));
      new MutationObserver(() => applyTheme(hostRoot.getAttribute('data-theme'))).observe(hostRoot, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    } catch {
      // Cross-origin host: rely on postMessage.
    }

    // Tell the host which lesson is open so /learn#lesson survives refreshes and can be shared.
    const reportRoute = () => {
      window.parent.postMessage({ type: 'sia-learn-route', hash: window.location.hash }, window.location.origin);
    };
    window.addEventListener('hashchange', reportRoute);
    window.addEventListener('load', () => {
      reportRoute();
      window.parent.postMessage({ type: 'sia-learn-ready' }, window.location.origin);
    });
  }

  // The guide scrolls to the top with a slow smooth scroll on every page change,
  // which reads as the page drifting. Jump instantly instead.
  const nativeScrollTo = window.scrollTo.bind(window);
  window.scrollTo = (...args) => {
    const [options] = args;
    if (options && typeof options === 'object' && options.behavior === 'smooth' && !options.top) {
      return nativeScrollTo({ ...options, behavior: 'instant' });
    }
    return nativeScrollTo(...args);
  };

  window.addEventListener('DOMContentLoaded', () => {
    if (!embedded) return;
    const brand = document.querySelector('.brand');
    if (brand) {
      brand.href = '/';
      brand.target = '_top';
      brand.setAttribute('aria-label', 'Back to SIA Education home');
    }
  });
})();
