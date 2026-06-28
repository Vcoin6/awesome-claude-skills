// Deterministic thread id for a pair of users (order-independent).
export function threadIdFor(a, b) {
  return [a, b].sort().join('__');
}

export function participantsOf(threadId) {
  return String(threadId || '').split('__');
}
