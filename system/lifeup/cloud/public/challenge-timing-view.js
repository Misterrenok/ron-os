export function challengeTimingRows(timing, formatDate) {
  if (timing?.kind !== 'CHALLENGE') return null;
  const recovery = timing.recovery_title
    ? `Активируется восстановление «${timing.recovery_title}»`
    : 'Активируется заранее согласованное восстановление';
  return [['Испытание до', formatDate(timing.at)], ['Если пропустить', recovery]];
}

export function challengeFocusCopy(timing, status, formatDate) {
  if (timing?.kind !== 'CHALLENGE') return null;
  return {
    deadline: `ИСПЫТАНИЕ ДО: ${formatDate(timing.at)}${timing.recovery_title ? ` · ВОССТАНОВЛЕНИЕ: ${timing.recovery_title}` : ''}`,
    time_label: status === 'OVERDUE' ? 'ИСПЫТАНИЕ ИСТЕКЛО' : 'ДО ИСПЫТАНИЯ'
  };
}
