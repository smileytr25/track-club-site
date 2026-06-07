(function () {
  const apiBase = window.location.port === '3000' ? '' : 'http://localhost:3000';
  const pagePath = window.location.pathname;
  let overrides = [];
  let applyTimer;

  function getPagePathCandidates() {
    const paths = [pagePath];
    const fileName = pagePath.split('/').pop();

    if (pagePath.startsWith('/html-source/')) {
      paths.push('/public-site' + pagePath);
    }

    if (fileName && fileName.endsWith('.html')) {
      paths.push('/public-site/html-source/' + fileName);
    }

    return [...new Set(paths)].filter(path => path.includes('/html-source/') && path.endsWith('.html'));
  }

  function applyOverrides() {
    overrides.forEach(override => {
      const element = document.querySelector(override.selector);
      if (!element || element.textContent === override.textContent) return;
      element.textContent = override.textContent;
    });
  }

  function scheduleApply() {
    window.clearTimeout(applyTimer);
    applyTimer = window.setTimeout(applyOverrides, 80);
  }

  async function applySiteCopy() {
    try {
      const results = await Promise.all(getPagePathCandidates().map(async candidate => {
        const response = await fetch(apiBase + '/api/site-copy/public?pagePath=' + encodeURIComponent(candidate));
        const data = await response.json();
        return response.ok && Array.isArray(data.overrides) ? data.overrides : [];
      }));

      const bySelector = new Map();
      results.flat().forEach(override => bySelector.set(override.selector, override));
      overrides = [...bySelector.values()];
      applyOverrides();

      const observer = new MutationObserver(scheduleApply);
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (error) {
      console.warn('Site copy overrides unavailable:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySiteCopy);
  } else {
    applySiteCopy();
  }
})();
