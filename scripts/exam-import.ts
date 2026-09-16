import { createHash } from 'node:crypto';
import type { Exam } from '../src/types';

export const headers = [
  'Subject',
  'Exam series',
  'Qual',
  'Examination code',
  'Title',
  'Date',
  'Unit',
  'Time',
  'Duration',
];
export const clean = (value: unknown): string => String(value ?? '').trim();

export function excelDate(value: unknown, date1904 = false): string {
  let date: Date;
  if (value instanceof Date) date = value;
  else if (typeof value === 'number' && Number.isFinite(value)) {
    if (!date1904 && Math.floor(value) === 60)
      throw new Error('Excel serial 60 is the nonexistent date 1900-02-29.');
    const days = Math.floor(value);
    date = new Date(
      Date.UTC(date1904 ? 1904 : 1899, date1904 ? 0 : 11, date1904 ? 1 : 31) +
        (days - (!date1904 && days > 60 ? 1 : 0)) * 86400000,
    );
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(clean(value))) {
    date = new Date(`${clean(value)}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== clean(value))
      throw new Error(`Invalid date: ${value}`);
  } else throw new Error(`Invalid date: ${clean(value)}. Expected an Excel date or YYYY-MM-DD.`);
  if (!Number.isFinite(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return date.toISOString().slice(0, 10);
}

export function parseRows(rows: unknown[][], date1904 = false): Exam[] {
  const headerIndex = rows.findIndex((row) => row.some((cell) => clean(cell) === 'Subject'));
  if (headerIndex < 0) throw new Error('Cannot find the timetable header row (Subject).');
  const names = rows[headerIndex].map(clean);
  const missing = headers.filter((h) => !names.includes(h));
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}`);
  const duplicates = headers.filter((h) => names.filter((n) => n === h).length > 1);
  if (duplicates.length) throw new Error(`Duplicate columns: ${duplicates.join(', ')}`);
  const occurrences = new Map<string, number>();
  return rows
    .slice(headerIndex + 1)
    .flatMap((row, index) => {
      if (row.every((cell) => !clean(cell))) return [];
      const value = (name: string) => row[names.indexOf(name)];
      try {
        for (const h of headers) if (!clean(value(h))) throw new Error(`Missing ${h}`);
        const session = clean(value('Time'));
        if (!['Morning', 'Afternoon', 'Window'].includes(session))
          throw new Error(`Unknown session: ${session}`);
        const exam = {
          subject: clean(value('Subject')),
          examSeries: clean(value('Exam series')),
          qualification: clean(value('Qual')),
          examinationCode: clean(value('Examination code')),
          title: clean(value('Title')),
          date: excelDate(value('Date'), date1904),
          unit: clean(value('Unit')),
          session: session as Exam['session'],
          duration: clean(value('Duration')),
          eventType: (/pre[\s-]*release/i.test(clean(value('Exam series')))
            ? 'preRelease'
            : 'exam') as Exam['eventType'],
        };
        const hash = createHash('sha256').update(JSON.stringify(exam)).digest('hex').slice(0, 16);
        const occurrence = (occurrences.get(hash) ?? 0) + 1;
        occurrences.set(hash, occurrence);
        return [{ id: `${hash}-${occurrence}`, ...exam }];
      } catch (error) {
        throw new Error(`Timetable row ${headerIndex + index + 2}: ${(error as Error).message}`);
      }
    })
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.subject.localeCompare(b.subject) ||
        a.examinationCode.localeCompare(b.examinationCode) ||
        a.id.localeCompare(b.id),
    );
}
