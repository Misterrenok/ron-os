const URL_RE = /https?:\/\/[^\s<>"']+/giu;

function trimTrailingPunctuation(value) {
  return String(value || '').replace(/[\]\[),.;!?]+$/u, '');
}

function normalizeHttpUrl(value) {
  try {
    const url = new URL(trimTrailingPunctuation(value));
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function questExecutionUrls(description) {
  const matches = String(description || '').match(URL_RE) || [];
  return [...new Set(matches.map(normalizeHttpUrl).filter(Boolean))];
}

export function questExecutionAction(quest) {
  const urls = questExecutionUrls(quest?.description);
  if (urls.length !== 1) return null;
  const href = urls[0];
  const title = String(quest?.title || '').toLocaleLowerCase('ru-RU');
  const lessonLike = /(урок|lesson|бебрис|bebris|nicos\s+weg)/iu.test(title);
  return {
    href,
    label: lessonLike ? 'НАЧАТЬ УРОК' : 'ОТКРЫТЬ ЗАДАНИЕ'
  };
}
