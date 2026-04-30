/**
 * Date formatting utilities
 */

/**
 * Format a date string or Date to dd/MM/yyyy
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('en-GB') // dd/MM/yyyy
}

/**
 * Format to yyyy-MM-dd (for <input type="date">)
 * @param {string|Date} date
 * @returns {string}
 */
export function toInputDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

/**
 * Month name from date
 * @param {string|Date} date
 * @returns {string}
 */
export function monthName(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('en-US', { month: 'long' })
}

/**
 * Format to relative time (e.g. "3 days ago")
 * @param {string|Date} date
 * @returns {string}
 */
export function relativeTime(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}
