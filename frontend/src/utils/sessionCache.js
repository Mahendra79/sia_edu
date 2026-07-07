// In-memory, module-scoped key/value store. Survives a page component
// unmounting/remounting during client-side navigation (e.g. going to a
// detail page and back), but resets on a full browser reload - unlike
// sessionStorage/localStorage, nothing here is meant to persist beyond
// the current tab's JS session.
const store = new Map();

export function getCached(key) {
  return store.get(key);
}

export function hasCached(key) {
  return store.has(key);
}

export function setCached(key, value) {
  store.set(key, value);
  return value;
}

export function clearCached(key) {
  store.delete(key);
}
