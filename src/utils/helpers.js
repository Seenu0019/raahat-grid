// ============================================================
// RAAHAT GRID — Utility helpers
// ============================================================

/**
 * Format a timestamp to a readable date/time string.
 */
export function formatDateTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a timestamp to a relative "time ago" string.
 */
export function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Return the CSS class suffix for a priority badge.
 */
export function priorityBadgeClass(priority) {
  const map = {
    Critical: 'critical',
    High: 'high',
    Medium: 'medium',
    Low: 'low',
  };
  return map[priority] || 'neutral';
}

/**
 * Return the CSS class suffix for a status badge.
 */
export function statusBadgeClass(status) {
  if (!status) return 'neutral';
  return status
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/**
 * Validate an Indian-style phone number.
 * Accepts +91 prefix, 10-digit numbers.
 */
export function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
}
