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
  tabs.forEach((item) => item.classList.toggle('active', item === selected));
  views.forEach((item) => item.classList.toggle('active', item.id === view));
  return true;
}
