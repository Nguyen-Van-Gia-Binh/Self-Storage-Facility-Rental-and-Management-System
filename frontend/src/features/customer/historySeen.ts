export const CUSTOMER_HISTORY_SEEN_KEY = 'customer-history-seen-at';

export function markCustomerHistorySeen(): string {
  const now = new Date().toISOString();
  localStorage.setItem(CUSTOMER_HISTORY_SEEN_KEY, now);
  return now;
}

export function readCustomerHistorySeenAt(): string {
  return localStorage.getItem(CUSTOMER_HISTORY_SEEN_KEY) || '';
}
