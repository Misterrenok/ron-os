const FILE_ID = /^[A-Za-z0-9_-]{4,100}$/;

export function strategyContextView(value) {
  if (!value || typeof value !== 'object' || value.policy_ref !== 'system-xmind-strategy-bridge:v1') return null;
  const fileId = typeof value.file_id === 'string' && FILE_ID.test(value.file_id) ? value.file_id : null;
  if (!fileId) return null;
  const verified = value.status === 'VERIFIED'
    && value.mode === 'READ_ONLY'
    && value.conflict_status === 'CLEAR'
    && Array.isArray(value.owner_refs)
    && value.owner_refs.length > 0;
  return {
    href: `https://app.xmind.com/share/${encodeURIComponent(fileId)}`,
    label: typeof value.topic_label === 'string' && value.topic_label.trim() ? value.topic_label.trim().slice(0, 180) : 'Цель в XMind',
    status_label: verified ? 'ПРОВЕРЕНО ПО КАНОНУ' : 'СВЯЗЬ НЕ ПРОВЕРЕНА',
    verified
  };
}

