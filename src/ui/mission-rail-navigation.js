(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FlightFlowMissionRailNavigation = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const ROUTES = Object.freeze({
    '#workspaceCard': Object.freeze({ key: 'operation', label: 'Operação', target: '#workspaceCard', view: 'operation' }),
    '#dropZone': Object.freeze({ key: 'map', label: 'Mapa', target: '#dropZone', view: 'map' }),
    '#fieldsGrid': Object.freeze({ key: 'board', label: 'Quadro', target: '[data-panel="data"]', tab: 'data', view: 'board' }),
    '#timelineList': Object.freeze({ key: 'events', label: 'Eventos', target: '[data-panel="timeline"]', tab: 'timeline', view: 'events' }),
    '#knowledgeBaseBtn': Object.freeze({ key: 'base', label: 'Base', target: '#knowledgeBrowserModal', control: '#knowledgeBaseBtn' }),
  });

  function routeForHref(href) {
    return ROUTES[String(href || '')] || null;
  }

  function setActiveItem(items, activeItem) {
    Array.from(items || []).forEach(item => {
      const active = item === activeItem;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'location');
      else item.removeAttribute('aria-current');
    });
    return activeItem || null;
  }

  function ensureFeedback(scope, rail) {
    let feedback = rail.querySelector('.evo-rail-feedback');
    if (feedback) return feedback;
    feedback = scope.createElement('span');
    feedback.className = 'evo-rail-feedback';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    const foot = rail.querySelector('.evo-rail-foot') || rail;
    foot.appendChild(feedback);
    return feedback;
  }

  function announce(feedback, route, suffix) {
    if (!feedback || !route) return;
    feedback.textContent = route.label + ' ' + (suffix || 'aberto');
  }

  function pulseTarget(target, win) {
    if (!target) return;
    target.classList.remove('evo-rail-target-pulse');
    void target.offsetWidth;
    target.classList.add('evo-rail-target-pulse');
    const timer = win && typeof win.setTimeout === 'function' ? win.setTimeout.bind(win) : setTimeout;
    timer(() => target.classList.remove('evo-rail-target-pulse'), 900);
  }

  function focusTarget(target, win) {
    if (!target || typeof target.focus !== 'function') return;
    const hadTabIndex = target.hasAttribute('tabindex');
    if (!hadTabIndex) target.setAttribute('tabindex', '-1');
    try {
      target.focus({ preventScroll: true });
    } catch (_) {
      target.focus();
    }
    if (!hadTabIndex) {
      const cleanup = () => target.removeAttribute('tabindex');
      target.addEventListener('blur', cleanup, { once: true });
      const timer = win && typeof win.setTimeout === 'function' ? win.setTimeout.bind(win) : setTimeout;
      timer(() => {
        if (target !== (target.ownerDocument && target.ownerDocument.activeElement)) cleanup();
      }, 1200);
    }
  }

  function applyView(scope, route) {
    if (!scope || !route || !route.view) return '';
    const root = scope.documentElement || scope.querySelector?.('html');
    if (!root) return '';
    root.dataset.railView = route.view;

    const win = scope.defaultView || (typeof window !== 'undefined' ? window : null);
    if (win && typeof win.dispatchEvent === 'function') {
      const notifyResize = () => win.dispatchEvent(new win.Event('resize'));
      if (typeof win.requestAnimationFrame === 'function') {
        win.requestAnimationFrame(() => win.requestAnimationFrame(notifyResize));
      } else {
        const timer = typeof win.setTimeout === 'function' ? win.setTimeout.bind(win) : setTimeout;
        timer(notifyResize, 0);
      }
    }
    return route.view;
  }

  function activateInspectorTab(scope, name) {
    if (!name) return null;
    const tab = scope.querySelector('.tab[data-tab="' + name + '"]');
    if (tab && !tab.classList.contains('active')) tab.click();
    return tab;
  }

  function navigate(scope, item, options) {
    const route = routeForHref(item && item.getAttribute('href'));
    if (!route) return null;

    const rail = scope.querySelector('.evo-rail');
    const items = rail ? rail.querySelectorAll('.evo-rail-item') : [];
    const feedback = rail ? ensureFeedback(scope, rail) : null;
    const win = scope.defaultView || (typeof window !== 'undefined' ? window : null);

    applyView(scope, route);
    activateInspectorTab(scope, route.tab);

    if (route.control) {
      const control = scope.querySelector(route.control);
      if (control && typeof control.click === 'function') control.click();
    }

    const target = scope.querySelector(route.target);
    if (target && route.key !== 'base') {
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      }
      focusTarget(target, win);
      pulseTarget(target, win);
    }

    setActiveItem(items, item);
    announce(feedback, route, options && options.initial ? 'ativa' : 'aberto');

    if (win && typeof win.CustomEvent === 'function') {
      scope.dispatchEvent(new win.CustomEvent('flightflow:rail-navigate', {
        detail: { key: route.key, label: route.label, href: item.getAttribute('href') }
      }));
    }
    return route;
  }

  function init(root) {
    const scope = root || (typeof document !== 'undefined' ? document : null);
    if (!scope) return null;
    const rail = scope.querySelector('.evo-rail');
    if (!rail) return null;

    const items = Array.from(rail.querySelectorAll('.evo-rail-item'));
    if (!items.length) return null;

    let lastContentItem = items.find(item => item.classList.contains('active')) || items[0];
    setActiveItem(items, lastContentItem);
    const initialRoute = routeForHref(lastContentItem.getAttribute('href'));
    applyView(scope, initialRoute);
    announce(ensureFeedback(scope, rail), initialRoute, 'ativa');

    items.forEach(item => {
      item.addEventListener('click', event => {
        event.preventDefault();
        const route = routeForHref(item.getAttribute('href'));
        if (!route) return;
        if (route.key !== 'base') lastContentItem = item;
        navigate(scope, item);
      });
    });

    scope.querySelectorAll('.tab[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const href = tab.dataset.tab === 'data' ? '#fieldsGrid' : tab.dataset.tab === 'timeline' ? '#timelineList' : '';
        if (!href) return;
        const item = items.find(candidate => candidate.getAttribute('href') === href);
        if (!item) return;
        const route = routeForHref(href);
        lastContentItem = item;
        applyView(scope, route);
        setActiveItem(items, item);
        announce(ensureFeedback(scope, rail), route, 'ativa');
      });
    });

    const knowledgeButton = scope.querySelector('#knowledgeBaseBtn');
    const baseItem = items.find(item => item.getAttribute('href') === '#knowledgeBaseBtn');
    if (knowledgeButton && baseItem) {
      knowledgeButton.addEventListener('click', () => {
        setActiveItem(items, baseItem);
        announce(ensureFeedback(scope, rail), routeForHref('#knowledgeBaseBtn'), 'aberta');
      });
    }

    const knowledgeDialog = scope.querySelector('#knowledgeBrowserModal');
    if (knowledgeDialog) {
      knowledgeDialog.addEventListener('close', () => {
        applyView(scope, routeForHref(lastContentItem.getAttribute('href')));
        setActiveItem(items, lastContentItem);
        announce(ensureFeedback(scope, rail), routeForHref(lastContentItem.getAttribute('href')), 'ativa');
      });
    }

    return Object.freeze({ rail, items });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init(document), { once: true });
    } else {
      init(document);
    }
  }

  return Object.freeze({ ROUTES, routeForHref, setActiveItem, applyView, navigate, init });
});
