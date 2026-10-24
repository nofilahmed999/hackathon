import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateStr, fmt = 'MMM dd, yyyy') {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return isValid(d) ? format(d, fmt) : '—';
}

export function formatDateTime(dateStr) {
  return formatDate(dateStr, 'MMM dd, yyyy hh:mm a');
}

export function formatTime(dateStr) {
  return formatDate(dateStr, 'hh:mm a');
}

export function formatCurrency(amount, currency = 'PKR') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

export function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function statusLabel(status) {
  if (!status) return '';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
