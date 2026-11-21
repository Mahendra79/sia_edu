// SIA Education extensions for the Learn Quantum guide. Loaded after app.js.
// Adds: older lessons back into the curriculum, full-curriculum search,
// "On this page" contents, lesson position, copy buttons on code, and an
// easier 3D model viewer. Upstream files stay untouched.
(() => {
  if (typeof navigationSections === 'undefined' || typeof renderSidebar !== 'function') return;

  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stripTags = (text) => String(text ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

  // ------------------------------------------------------------------
  // 1. Older lessons back in the curriculum.
  // The guide still contains the earlier Gates, Circuits, Algorithms,
  // Simulation, Frameworks and Applications lessons. Upstream already maps
  // them to these sections; only the sidebar entries were missing.
  // ------------------------------------------------------------------
  const label = (title) => ({ title, label: true });
  const routeList = (topics, group) => topics.map((topic, index) => ({ title: topic.title, route: { group, index } }));
  const flattenGates = (groups) => groups.flatMap((group) => [
    { title: group.title, route: { group: 'gate', page: group.page } },
    ...(group.children ? flattenGates(group.children) : []),
  ]);
  const section = (id) => navigationSections.find((item) => item.id === id);
  const addTopics = (id, topics) => {
    const target = section(id);
    if (target) target.topics = [...target.topics, ...topics];
  };

  if (typeof gateGroups !== 'undefined') {
    addTopics('circuits-and-gates', [label('Gate reference'), ...flattenGates(gateGroups)]);
  }
  if (typeof circuitTopics !== 'undefined') {
    addTopics('circuits-and-gates', [label('Circuit fundamentals'), ...routeList(circuitTopics, 'circuit')]);
  }
  if (typeof simulationTopics !== 'undefined') {
    addTopics('sia-script-programming', [label('Quantum simulation'), ...routeList(simulationTopics, 'simulation')]);
  }
  if (typeof algorithmTopics !== 'undefined') {
    addTopics('quantum-algorithms-and-applications', [label('Algorithm walkthroughs'), ...routeList(algorithmTopics, 'algorithm')]);
  }
  if (typeof applicationTopics !== 'undefined') {
    const applications = routeList(applicationTopics, 'application');
    // Upstream files "Quantum Machine Learning" (index 2) under the ML section.
    addTopics('quantum-algorithms-and-applications', [label('Applications'), ...applications.filter((item) => item.route.index !== 2)]);
    addTopics('quantum-machine-learning-and-integration', [label('Applications'), ...applications.filter((item) => item.route.index === 2)]);
  }
  if (typeof frameworkTopics !== 'undefined') {
    addTopics('quantum-machine-learning-and-integration', [label('Quantum frameworks'), ...routeList(frameworkTopics, 'framework')]);
  }

  // Upstream renders topics without a route as disabled spans; give group labels their own class.
  const baseRender = renderSidebar;
  // eslint-disable-next-line no-global-assign
  renderSidebar = function renderSidebarWithLabels(...args) {
    const result = baseRender.apply(this, args);
    $$('#chapter-list .chapter-topic.navigation-only').forEach((node) => node.classList.add('sia-nav-label'));
    // Upstream keeps a gate page selected in the background, so on SIA docs pages
    // "Gate reference → Introduction" would also light up. Keep only the real lesson.
    if (typeof state !== 'undefined' && state.activeDocTopic >= 0 && /^#sia-doc-/.test(window.location.hash)) {
      $$('#chapter-list .chapter-topic.active:not([data-nav-route="sia-doc"])').forEach((node) => {
        node.classList.toggle('active', false);
        node.setAttribute('aria-current', 'false');
      });
    }
    return result;
  };
  renderSidebar();
  // Upstream updates its routing state after drawing the sidebar; redraw once the
  // route has settled so exactly one lesson is highlighted.
  window.addEventListener('hashchange', () => requestAnimationFrame(() => renderSidebar()));

  // ------------------------------------------------------------------
  // 2. Search across every lesson.
  // ------------------------------------------------------------------
  const routeText = (route) => {
    try {
      switch (route.group) {
        case 'fundamentals': return [fundamentalsTopics[route.index], typeof phaseOneLessonSupport !== 'undefined' && phaseOneLessonSupport[`fundamentals-${route.index}`]];
        case 'math': {
          const topic = mathematicsTopics[route.index];
          return [topic, typeof phaseOneLessonSupport !== 'undefined' && phaseOneLessonSupport[`math-${topic.slug}`]];
        }
        case 'sia-doc': return [siaDocTopics[route.index]];
        case 'gate': return [typeof gateLessons !== 'undefined' && gateLessons[route.page]];
        case 'circuit': return [circuitTopics[route.index]];
        case 'algorithm': return [algorithmTopics[route.index]];
        case 'simulation': return [simulationTopics[route.index]];
        case 'framework': return [frameworkTopics[route.index]];
        case 'application': return [applicationTopics[route.index]];
        default: return [];
      }
    } catch {
      return [];
    }
  };

  const flattenText = (value, out = []) => {
    if (!value) return out;
    if (typeof value === 'string') out.push(value);
    else if (Array.isArray(value)) value.forEach((item) => flattenText(item, out));
    else if (typeof value === 'object') Object.entries(value).forEach(([key, item]) => { if (!['sectionIndex', 'chapter', 'slug', 'route', 'index'].includes(key)) flattenText(item, out); });
    return out;
  };

  let searchIndex = null;
  const buildIndex = () => {
    searchIndex = [];
    navigationSections.forEach((nav) => {
      nav.topics.forEach((topic) => {
        if (!topic.route) return;
        const text = stripTags(flattenText(routeText(topic.route)).join(' '));
        searchIndex.push({ title: topic.title, section: nav.title, route: topic.route, titleLower: topic.title.toLowerCase(), text, textLower: text.toLowerCase() });
      });
    });
  };

  const navigateTo = (route) => {
    const selector = route.group === 'gate'
      ? `[data-nav-route="gate"][data-nav-page="${route.page}"]`
      : `[data-nav-route="${route.group}"][data-nav-index="${route.index}"]`;
    const button = $(`#chapter-list ${selector}`);
    if (button) button.click();
  };

  const searchLessons = (query) => {
    if (!searchIndex) buildIndex();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const results = [];
    searchIndex.forEach((entry) => {
      let score = 0;
      for (const term of terms) {
        const inTitle = entry.titleLower.includes(term);
        const inSection = entry.section.toLowerCase().includes(term);
        const inText = entry.textLower.includes(term);
        if (!inTitle && !inSection && !inText) return;
        score += (inTitle ? 10 : 0) + (entry.titleLower.startsWith(term) ? 4 : 0) + (inSection ? 2 : 0) + (inText ? 1 : 0);
      }
      let snippet = '';
      if (!terms.every((term) => entry.titleLower.includes(term))) {
        const at = entry.textLower.indexOf(terms.find((term) => entry.textLower.includes(term)) ?? '');
        if (at >= 0) {
          const start = Math.max(0, at - 50);
          snippet = `${start > 0 ? '…' : ''}${entry.text.slice(start, at + 90).trim()}…`;
        }
      }
      results.push({ entry, score, snippet });
    });
    return results.sort((a, b) => b.score - a.score).slice(0, 8);
  };

  const highlight = (text, query) => {
    let html = escapeHtml(text);
    query.toLowerCase().split(/\s+/).filter((term) => term.length > 1).forEach((term) => {
      html = html.replace(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
    });
    return html;
  };

  // Replace the upstream input (which only searched old chapter names) with a fresh one.
  const oldInput = $('#search-input');
  const oldResults = $('#search-results');
  if (oldInput && oldResults) {
    const input = oldInput.cloneNode(true);
    oldInput.replaceWith(input);
    input.placeholder = 'Search lessons';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-controls', 'search-results');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-autocomplete', 'list');

    const box = input.closest('.search-box');
    const wrap = document.createElement('div');
    wrap.className = 'sia-search';
    box.replaceWith(wrap);
    wrap.append(box, oldResults);
    oldResults.setAttribute('role', 'listbox');

    let active = -1;
    let current = [];
    const close = () => { oldResults.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; };
    const setActive = (index) => {
      const items = $$('.sia-search-result', oldResults);
      active = items.length ? (index + items.length) % items.length : -1;
      items.forEach((item, i) => item.classList.toggle('is-active', i === active));
      // Scroll only the results list (scrollIntoView would also scroll the sidebar).
      const item = items[active];
      if (item) {
        if (item.offsetTop < oldResults.scrollTop) oldResults.scrollTop = item.offsetTop - 6;
        else if (item.offsetTop + item.offsetHeight > oldResults.scrollTop + oldResults.clientHeight) oldResults.scrollTop = item.offsetTop + item.offsetHeight - oldResults.clientHeight + 6;
      }
    };
    const open = (index) => {
      const result = current[index];
      if (!result) return;
      close();
      input.value = '';
      input.blur();
      navigateTo(result.entry.route);
    };
    const render = () => {
      const query = input.value.trim();
      if (!query) { close(); return; }
      current = searchLessons(query);
      oldResults.innerHTML = current.length
        ? current.map((result, index) => `<button type="button" class="sia-search-result" role="option" data-index="${index}">
            <span class="sia-search-section">${escapeHtml(result.entry.section)}</span>
            <strong>${highlight(result.entry.title, query)}</strong>
            ${result.snippet ? `<small>${highlight(result.snippet, query)}</small>` : ''}
          </button>`).join('')
        : `<p class="sia-search-empty">No lessons match “${escapeHtml(query)}”.</p>`;
      oldResults.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      setActive(0);
    };
    input.addEventListener('input', render);
    input.addEventListener('focus', () => { if (input.value.trim()) render(); });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
      else if (event.key === 'Enter') { event.preventDefault(); open(active < 0 ? 0 : active); }
      else if (event.key === 'Escape') { input.value = ''; close(); input.blur(); }
    });
    oldResults.addEventListener('mousedown', (event) => event.preventDefault());
    oldResults.addEventListener('click', (event) => {
      const button = event.target.closest('.sia-search-result');
      if (button) open(Number(button.dataset.index));
    });
    document.addEventListener('pointerdown', (event) => { if (!wrap.contains(event.target)) close(); });

    // Phones show only a search icon; tapping it opens a full-width search bar.
    box.addEventListener('click', () => {
      if (wrap.classList.contains('is-open')) return;
      wrap.classList.add('is-open');
      requestAnimationFrame(() => input.focus());
    });
    input.addEventListener('blur', () => {
      setTimeout(() => { if (document.activeElement !== input) wrap.classList.remove('is-open'); }, 150);
    });

    // Inside the SIA site the guide's top bar is hidden on desktop, so the search
    // lives at the top of the curriculum there and in the top bar on phones.
    const sidebar = $('#sidebar');
    const topbarSlot = $('.header-actions');
    const desktop = window.matchMedia('(min-width: 901px)');
    const place = () => {
      const inSidebar = root.classList.contains('embedded') && desktop.matches;
      if (inSidebar && wrap.parentElement !== sidebar) sidebar.prepend(wrap);
      else if (!inSidebar && wrap.parentElement !== topbarSlot) topbarSlot.prepend(wrap);
      wrap.classList.toggle('in-sidebar', inSidebar);
    };
    place();
    desktop.addEventListener('change', place);
  }

  // ------------------------------------------------------------------
  // Icons: replace the guide's text glyphs (⌕ ☰ ⌁ ← →) with consistent SVGs.
  // ------------------------------------------------------------------
  const svg = (paths, cls = 'sia-icon') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
  const UI_ICONS = {
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    prev: svg('<path d="M15 5l-7 7 7 7"/>'),
    next: svg('<path d="M9 5l7 7-7 7"/>'),
    copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
    check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  };
  const setIcon = (selector, icon) => { const el = $(selector); if (el) el.innerHTML = icon; };
  setIcon('.search-box > span[aria-hidden="true"]', UI_ICONS.search);
  // Phone menu: hamburger icon only (the "Menu" word is dropped; the button keeps
  // its aria-label "Open navigation" for screen readers).
  const menuButton = $('#menu-button');
  if (menuButton) {
    menuButton.innerHTML = `<span>${UI_ICONS.menu}</span>`;
    menuButton.title = 'Open navigation';
  }
  // Brand: the SIA logo (same image as the main site's mobile bar).
  setIcon('.brand-mark', '<img class="sia-brand-logo" src="images/sia-logo.webp" alt="" width="30" height="30">');
  $('.brand-mark')?.classList.add('has-logo');
  setIcon('#previous-button > span', UI_ICONS.prev);
  setIcon('#next-button > span', UI_ICONS.next);

  // ------------------------------------------------------------------
  // 3. Lesson enhancements: position, "On this page", copy buttons, 3D.
  // ------------------------------------------------------------------
  const header = $('#lesson-header');
  const lessonBody = $('#lesson-body');
  const lessonGrid = $('.lesson-grid');

  const position = document.createElement('div');
  position.className = 'sia-lesson-position';
  // Not shown: the lesson header keeps its original, plain layout.

  const toc = document.createElement('aside');
  toc.className = 'sia-toc';
  toc.setAttribute('aria-label', 'On this page');
  lessonGrid?.append(toc);

  const updatePosition = () => {
    // Keep the header's chapter chip in step with the sidebar section number
    // (upstream hard-codes it per lesson type, which drifts as sections are added).
    const sectionNumber = $('#chapter-list .chapter-item.active .chapter-index')?.textContent?.trim();
    const headerNumber = $('#lesson-number');
    if (sectionNumber && headerNumber && headerNumber.textContent !== sectionNumber) headerNumber.textContent = sectionNumber;

    const activeTopic = $('#chapter-list .chapter-topic.active');
    if (!activeTopic) { position.hidden = true; return; }
    // Count lessons within the topic's group (sub-group labels split groups).
    const siblings = [...activeTopic.parentElement.children];
    const at = siblings.indexOf(activeTopic);
    let start = at; while (start > 0 && !siblings[start - 1].classList.contains('sia-nav-label')) start -= 1;
    let end = at; while (end < siblings.length - 1 && !siblings[end + 1].classList.contains('sia-nav-label')) end += 1;
    const group = siblings.slice(start, end + 1);
    const groupLabel = start > 0 ? siblings[start - 1].textContent : '';
    const sectionName = activeTopic.closest('.nav-section')?.querySelector('.chapter-name')?.textContent || '';
    position.hidden = false;
    position.innerHTML = `<span class="sia-position-text">Lesson ${at - start + 1} of ${group.length}${groupLabel ? ` · ${escapeHtml(groupLabel)}` : ` · ${escapeHtml(sectionName)}`}</span>
      <span class="sia-position-track" aria-hidden="true">${group.map((_, i) => `<i class="${i < at - start ? 'done' : i === at - start ? 'current' : ''}"></i>`).join('')}</span>`;
  };

  let tocObserver;
  const buildToc = () => {
    tocObserver?.disconnect();
    const headings = $$('h2', lessonBody).filter((heading) => heading.textContent.trim());
    if (headings.length < 2) { toc.hidden = true; toc.innerHTML = ''; lessonGrid?.classList.remove('has-toc'); return; }
    headings.forEach((heading, index) => { heading.dataset.siaSection = String(index); });
    toc.hidden = false;
    lessonGrid?.classList.add('has-toc');
    toc.innerHTML = `<p class="sia-toc-title">On this page</p><ol>${headings.map((heading, index) => `<li><button type="button" data-target="${index}">${escapeHtml(heading.textContent.trim())}</button></li>`).join('')}</ol>`;
    const buttons = $$('button', toc);
    const setCurrent = (index) => buttons.forEach((button, i) => button.classList.toggle('is-current', i === index));
    setCurrent(0);
    toc.onclick = (event) => {
      const button = event.target.closest('button[data-target]');
      if (!button) return;
      // Scroll without touching the URL hash (the guide uses the hash for routing).
      headings[Number(button.dataset.target)]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    tocObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setCurrent(Number(visible.target.dataset.siaSection));
    }, { rootMargin: '0px 0px -70% 0px' });
    headings.forEach((heading) => tocObserver.observe(heading));
  };

  const addCopyButtons = () => {
    $$('pre.hdqs-code, pre.code-block, .hdqs-code', lessonBody).forEach((block) => {
      if (block.dataset.siaCopy || block.closest('.sia-code')) return;
      block.dataset.siaCopy = 'true';
      const frame = document.createElement('div');
      frame.className = 'sia-code';
      block.replaceWith(frame);
      frame.append(block);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sia-copy';
      const setState = (icon, label) => { button.innerHTML = icon; button.title = label; button.setAttribute('aria-label', label); };
      setState(UI_ICONS.copy, 'Copy code');
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(block.innerText);
          setState(UI_ICONS.check, 'Copied');
          button.classList.add('is-done');
        } catch {
          // Clipboard blocked: select the code so Ctrl+C works.
          const range = document.createRange(); range.selectNodeContents(block);
          const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
          setState(UI_ICONS.copy, 'Code selected – press Ctrl+C');
        }
        setTimeout(() => { setState(UI_ICONS.copy, 'Copy code'); button.classList.remove('is-done'); }, 1600);
      });
      frame.append(button);
    });
  };

  // ---------- 3D viewers: always live, icon controls, quick jump ----------
  const ICONS = {
    zoomIn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    zoomOut: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>',
    full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    exitFull: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  };

  // Zoom through the viewer's own wheel handler (OrbitControls listens on the canvas).
  const zoom = (preview, direction) => {
    const canvas = $('canvas', preview);
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: direction * 240, deltaMode: 0, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, bubbles: true, cancelable: true }));
  };

  const resetViewer = (preview) => {
    // Rebuild the viewer through the guide's own initialiser; the model file is cached.
    if (typeof initializeInteractive3DModels !== 'function') return;
    $('canvas', preview)?.remove();
    delete preview.dataset.initialized;
    if (!$('[data-model-status]', preview)) {
      const status = document.createElement('span');
      status.className = 'model-preview-status';
      status.setAttribute('data-model-status', '');
      status.textContent = 'Loading model…';
      preview.append(status);
    }
    initializeInteractive3DModels();
  };

  const enhanceModels = () => {
    const previews = $$('.model-preview[data-model-preview]', lessonBody);
    previews.forEach((preview, index) => {
      if (preview.dataset.siaEnhanced) return;
      preview.dataset.siaEnhanced = 'true';
      const article = preview.closest('article, section');
      const title = article?.querySelector('h3, h2')?.textContent?.trim() || `Model ${index + 1}`;
      if (article) article.dataset.siaModel = String(index);

      const tools = document.createElement('div');
      tools.className = 'sia-3d-tools';
      tools.innerHTML = `
        <button type="button" data-action="in" title="Zoom in" aria-label="Zoom in">${ICONS.zoomIn}</button>
        <button type="button" data-action="out" title="Zoom out" aria-label="Zoom out">${ICONS.zoomOut}</button>
        <button type="button" data-action="reset" title="Reset view" aria-label="Reset view">${ICONS.reset}</button>
        <button type="button" data-action="full" title="Full screen" aria-label="Full screen">${ICONS.full}</button>`;
      tools.addEventListener('click', (event) => {
        const action = event.target.closest('button')?.dataset.action;
        if (action === 'in') zoom(preview, -1);
        if (action === 'out') zoom(preview, 1);
        if (action === 'reset') resetViewer(preview);
        if (action === 'full') {
          if (document.fullscreenElement === preview) document.exitFullscreen();
          else preview.requestFullscreen?.().catch(() => {});
        }
      });
      preview.append(tools);
      preview.setAttribute('aria-label', `${title}: interactive 3D model. Drag to rotate, pinch or use the zoom buttons.`);

      // A plain mouse wheel keeps scrolling the page; Ctrl + wheel, pinch, the
      // buttons, or full screen zoom the model. Real wheel events only.
      preview.addEventListener('wheel', (event) => {
        if (!event.isTrusted) return;
        if (event.ctrlKey || event.metaKey || document.fullscreenElement === preview) return;
        event.stopPropagation();
      }, { capture: true });
    });

    // A quick-jump list at the top of pages with several models.
    if (previews.length >= 3 && !$('.sia-3d-index', lessonBody)) {
      const index = document.createElement('nav');
      index.className = 'sia-3d-index';
      index.setAttribute('aria-label', '3D models on this page');
      index.innerHTML = `<p>${previews.length} interactive models on this page</p><div>${previews.map((preview, i) => {
        const article = preview.closest('article, section');
        const name = article?.querySelector('h3, h2')?.textContent?.trim() || `Model ${i + 1}`;
        const format = (preview.dataset.modelPreview || '').toUpperCase();
        return `<button type="button" data-model="${i}"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(format)}</span></button>`;
      }).join('')}</div>`;
      index.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-model]');
        if (!button) return;
        const preview = previews[Number(button.dataset.model)];
        (preview.closest('article, section') || preview).scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      const firstModelBlock = previews[0].closest('.structured-3d-section, section, article');
      (firstModelBlock?.parentElement === lessonBody ? firstModelBlock : lessonBody.firstElementChild)?.before(index);
    }
  };

  document.addEventListener('fullscreenchange', () => {
    $$('.model-preview').forEach((preview) => {
      const isFull = document.fullscreenElement === preview;
      preview.classList.toggle('is-fullscreen', isFull);
      const button = $('[data-action="full"]', preview);
      if (button) {
        button.innerHTML = isFull ? ICONS.exitFull : ICONS.full;
        button.title = isFull ? 'Exit full screen' : 'Full screen';
        button.setAttribute('aria-label', button.title);
      }
    });
  });

  // Replace the trailing "↗" character in links with an SVG icon, and open
  // generated HTML pages in a new tab so they never replace the guide itself.
  const polishLinks = () => {
    $$('a[href]', lessonBody).forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (!link.target && !link.hasAttribute('download') && /\.html?(\?|#|$)/i.test(href) && !href.startsWith('#')) {
        link.target = '_blank';
        link.rel = 'noopener';
      }
    });
    $$('a', lessonBody).forEach((link) => {
      if (link.dataset.siaLink) return;
      const last = [...link.childNodes].reverse().find((node) => node.nodeType === 3 && node.textContent.trim());
      if (!last || !/↗\s*$/.test(last.textContent)) return;
      link.dataset.siaLink = 'true';
      last.textContent = last.textContent.replace(/\s*↗\s*$/, '');
      link.insertAdjacentHTML('beforeend', svg('<path d="M7 17 17 7M9 7h8v8"/>', 'sia-icon sia-ext'));
    });
  };

  let pending = false;
  const enhance = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      updatePosition();
      buildToc();
      addCopyButtons();
      polishLinks();
      enhanceModels();
    });
  };

  if (lessonBody) new MutationObserver((mutations) => {
    if (mutations.some((mutation) => [...mutation.addedNodes].some((node) => node.nodeType === 1 && !node.closest?.('.sia-code, .sia-3d-index') && !node.classList?.contains('sia-3d-start') && !node.classList?.contains('sia-3d-tools') && node.tagName !== 'CANVAS'))) enhance();
  }).observe(lessonBody, { childList: true });
  const chapterList = $('#chapter-list');
  if (chapterList) new MutationObserver(() => requestAnimationFrame(updatePosition)).observe(chapterList, { childList: true });
  enhance();
})();
