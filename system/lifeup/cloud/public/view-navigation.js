export const DEFAULT_VIEW = 'status';

export function viewFromSearch(search, allowedViews, fallback = DEFAULT_VIEW) {
  const requested = new URLSearchParams(search).get('view');
  return allowedViews.includes(requested) ? requested : fallback;
}

export function urlForView(href, view, fallback = DEFAULT_VIEW) {
  const url = new URL(href);
  if (view === fallback) url.searchParams.delete('view');
  else url.searchParams.set('view', view);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function activateViewState(tabs, views, view) {
  const selected = tabs.find((item) => item.dataset.view === view);
  if (!selected) return false;
  tabs.forEach((item) => {
    const active = item === selected;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
  });
  views.forEach((item) => {
    const active = item.id === view;
    item.classList.toggle('active', active);
    item.hidden = !active;
  });
  return true;
}

export function viewForNavigationKey(views, currentView, key) {
  const current = views.indexOf(currentView);
  if (current < 0 || views.length === 0) return null;
  if (key === 'Home') return views[0];
  if (key === 'End') return views.at(-1);
  if (key === 'ArrowRight') return views[(current + 1) % views.length];
  if (key === 'ArrowLeft') return views[(current - 1 + views.length) % views.length];
  return null;
}
