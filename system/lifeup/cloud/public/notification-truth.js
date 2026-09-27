const NEXT_LEVEL_RE = /До уровня\s+(\d+)\s*:\s*(\d+)\s*XP/iu;

function integerOrNull(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

export function truthfulRewardNotification(notification, profile) {
  const title = notification?.title ?? '';
  const body = notification?.body ?? notification?.kind ?? '';
  if (String(notification?.kind || '').toUpperCase() !== 'REWARD') {
    return { ...notification, title, body, historical_progression: false };
  }

  const match = String(body).match(NEXT_LEVEL_RE);
  if (!match) return { ...notification, title, body, historical_progression: false };

  const historicalTarget = Number(match[1]);
  const historicalRemaining = Number(match[2]);
  const currentLevel = integerOrNull(profile?.level);
  const currentRemaining = integerOrNull(profile?.xp_to_next);
  if (currentLevel == null || currentRemaining == null) {
    return { ...notification, title, body, historical_progression: false };
  }

  const currentTarget = currentLevel + 1;
  if (historicalTarget === currentTarget && historicalRemaining === currentRemaining) {
    return { ...notification, title, body, historical_progression: false };
  }

  const prefix = String(body).replace(NEXT_LEVEL_RE, '').replace(/[·\s]+$/u, '').trim();
  const historical = `Исторически в уведомлении было: до уровня ${historicalTarget} — ${historicalRemaining} XP.`;

  if (historicalTarget <= currentLevel) {
    return {
      ...notification,
      title,
      body: `${prefix ? `${prefix} · ` : ''}${historical} Этот порог уже пройден. Сейчас уровень ${currentLevel}. До уровня ${currentTarget}: ${currentRemaining} XP.`,
      historical_progression: true
    };
  }

  if (historicalTarget === currentTarget) {
    return {
      ...notification,
      title,
      body: `${prefix ? `${prefix} · ` : ''}${historical} По текущей шкале: До уровня ${currentTarget}: ${currentRemaining} XP.`,
      historical_progression: true
    };
  }

  return { ...notification, title, body, historical_progression: false };
}
