import type { Exam } from '../types';
import { formatDate } from './dates';

export function windowLabel(exam: Exam) {
  if (!exam.windowStart || !exam.windowEnd) return 'Window dates not confirmed';
  return exam.windowStart === exam.windowEnd
    ? `${formatDate(exam.windowStart)} (one day)`
    : `${formatDate(exam.windowStart)} – ${formatDate(exam.windowEnd)}`;
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
