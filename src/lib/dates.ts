export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const parseDate = (date: string) => new Date(`${date}T12:00:00`);
export const formatDate = (
  date: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
) => new Intl.DateTimeFormat('en-GB', options).format(parseDate(date));
export const monthTitle = (month: string) =>
  formatDate(`${month}-01`, { month: 'long', year: 'numeric' });
export function shiftMonth(month: string, offset: number) {
  const date = parseDate(`${month}-01`);
  date.setMonth(date.getMonth() + offset);
  return localDate(date).slice(0, 7);
}
export function monthDays(month: string): string[] {
  const first = parseDate(`${month}-01`);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) =>
    localDate(new Date(first.getFullYear(), first.getMonth(), index - offset + 1, 12)),
  );
}
