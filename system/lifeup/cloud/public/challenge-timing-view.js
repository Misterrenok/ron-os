export function challengeTimingRows(timing, formatDate) {
  if (timing?.kind !== 'CHALLENGE') return null;
  const recovery = timing.recovery_title
    ? `награда задания утрачивается, серия рвётся, затем «${timing.recovery_title}»`
    : 'награда задания утрачивается, серия рвётся и активируется восстановление';
  return [['Испытание до', formatDate(timing.at)], ['Ставка при промахе', recovery]];
}

export function challengeFocusCopy(timing, status, formatDate) {
  if (timing?.kind !== 'CHALLENGE') return null;
  return {
    deadline: `ИСПЫТАНИЕ ДО: ${formatDate(timing.at)} · СТАВКА: НАГРАДА + СЕРИЯ${timing.recovery_title ? ` · ВОССТАНОВЛЕНИЕ: ${timing.recovery_title}` : ''}`,
    time_label: status === 'OVERDUE' ? 'ИСПЫТАНИЕ ИСТЕКЛО' : 'ДО ИСПЫТАНИЯ'
  };
}
