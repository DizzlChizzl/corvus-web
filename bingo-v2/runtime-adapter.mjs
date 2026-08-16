// Browser-safe adapter boundary. This module never contains Google credentials.
// A separately authorized backend may expose a public-safe/session-scoped JSON snapshot.
export async function loadRuntimeRows(url, fetchImpl = fetch) {
  if (!url) return [];
  const response = await fetchImpl(url, { cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error(`BINGO_V2_RUNTIME_FETCH_FAILED:${response.status}`);
  const payload = await response.json();
  if (!payload || !Array.isArray(payload.rows)) throw new Error('BINGO_V2_RUNTIME_PAYLOAD_INVALID');
  return payload.rows;
}
