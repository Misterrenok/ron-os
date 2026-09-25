export function bytesToBase64Url(value) {
  if (value == null) return '';
  const bytes = value instanceof Uint8Array
    ? value
    : value instanceof ArrayBuffer
      ? new Uint8Array(value)
      : ArrayBuffer.isView(value)
        ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
        : null;
  if (!bytes) return '';
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function subscriptionApplicationServerKey(subscription) {
  return bytesToBase64Url(subscription?.options?.applicationServerKey ?? null);
}

export function subscriptionUsesPublicKey(subscription, publicKey) {
  const current = subscriptionApplicationServerKey(subscription);
  return Boolean(current && publicKey && current === String(publicKey).trim());
}
