export const VISUAL_AUDIT_QUERY = 'visual-audit';

export function allowsUnauthenticatedSnapshotRead({ method, pathname, searchParams } = {}) {
  return method === 'GET'
    && pathname === '/api/v1/snapshot'
    && searchParams?.get?.(VISUAL_AUDIT_QUERY) === '1';
}
