(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FlightFlowEvolutionShellV4 = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const MILESTONE_CLASSES = Object.freeze(['milestone-dep', 'milestone-trf', 'milestone-ter']);

  function classifyMilestone(messageType = '', operation = '') {
    const type = String(messageType || '').trim().toUpperCase();
    const op = String(operation || '').trim().toUpperCase();
    const text = [type, op].join(' ');

    if (type === 'TER' || /\bORDEM\s+TER\b/.test(text)) return 'ter';
    if (type === 'DEP' || /\bMENSAGEM\s+DEP\b/.test(text)) return 'dep';
    if (type === 'TRF' || /\bTRANSFER(?:ENCIA|ÊNCIA|IR|IDO|IDA|INDO)?\b/.test(text) || /\bHANDOFF\b/.test(text)) return 'trf';
    return '';
  }

  function milestoneLabel(kind) {
    return kind === 'dep' ? 'DEP' : kind === 'trf' ? 'TRF' : kind === 'ter' ? 'TER' : '';
  }

  function ensureShellIdentity(root) {
    const scope = root || (typeof document !== 'undefined' ? document : null);
    if (!scope) return false;

    const title = scope.querySelector('#appTitle');
    if (!title) return false;
    if (title.querySelector('.evo-product-badge')) return true;

    const badge = scope.createElement('span');
    badge.className = 'evo-product-badge';
    badge.textContent = 'EVOLUÇÃO';
    title.appendChild(badge);
    return true;
  }

  function decorateTimeline(root) {
    const scope = root || (typeof document !== 'undefined' ? document : null);
    if (!scope) return { items: 0, milestones: 0 };

    const list = scope.querySelector('#timelineList');
    const track = scope.querySelector('#transportMilestones');
    if (!list || !track) return { items: 0, milestones: 0 };

    const items = Array.from(list.querySelectorAll('.timeline-item'));
    const milestones = [];

    items.forEach((item, index) => {
      MILESTONE_CLASSES.forEach(name => item.classList.remove(name));
      item.classList.remove('milestone');
      delete item.dataset.milestone;
      item.querySelector('.timeline-milestone')?.remove();

      const operation = item.querySelector('.timeline-op')?.textContent || '';
      const messageType = item.querySelector('.timeline-meta .timeline-chip')?.textContent || '';
      const kind = classifyMilestone(messageType, operation);
      if (!kind) return;

      const label = milestoneLabel(kind);
      item.classList.add('milestone', 'milestone-' + kind);
      item.dataset.milestone = kind;

      const meta = item.querySelector('.timeline-meta');
      if (meta) {
        const badge = scope.createElement('span');
        badge.className = 'timeline-milestone timeline-milestone-' + kind;
        badge.textContent = label;
        meta.prepend(badge);
      }

      milestones.push({
        index,
        kind,
        label,
        time: item.querySelector('.timeline-time > span:last-child')?.textContent?.trim() || ''
      });
    });

    const maxIndex = Math.max(1, items.length - 1);
    const fragment = scope.createDocumentFragment();
    milestones.forEach(item => {
      const marker = scope.createElement('span');
      marker.className = 'evo-transport-marker evo-transport-marker-' + item.kind;
      marker.style.setProperty('--evo-marker-pos', ((item.index / maxIndex) * 100).toFixed(3) + '%');
      marker.title = [item.label, item.time].filter(Boolean).join(' · ');
      marker.setAttribute('aria-hidden', 'true');

      const label = scope.createElement('b');
      label.textContent = item.label;
      marker.appendChild(label);
      fragment.appendChild(marker);
    });

    track.replaceChildren(fragment);
    track.hidden = milestones.length === 0;
    return { items: items.length, milestones: milestones.length };
  }

  function init(root) {
    const scope = root || (typeof document !== 'undefined' ? document : null);
    if (!scope) return null;
    const list = scope.querySelector('#timelineList');
    if (!list) return null;

    ensureShellIdentity(scope);
    decorateTimeline(scope);
    if (typeof MutationObserver !== 'function') return null;

    const observer = new MutationObserver(() => decorateTimeline(scope));
    observer.observe(list, { childList: true });
    return observer;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init(document), { once: true });
    } else {
      init(document);
    }
  }

  return Object.freeze({ classifyMilestone, milestoneLabel, ensureShellIdentity, decorateTimeline, init });
});
