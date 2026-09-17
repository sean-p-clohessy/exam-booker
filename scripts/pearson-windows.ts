import type { Exam } from '../src/types';
import { excelDate } from './exam-import';

export const pearsonOverview =
  'https://pearsontablebuilder.netlify.app/ld/btec-external-assessment-overview-8u07';
export const normalise = (value: unknown) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
export function pearsonDate(value: unknown): string {
  const text = normalise(value);
  if (!text || /^(n\/a|-)$/i.test(text)) return '';
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  return excelDate(match ? `${match[3]}-${match[2]}-${match[1]}` : text);
}
export function matchWindow(exam: Exam, rows: Record<string, unknown>[]): Partial<Exam> {
  const matches = rows.filter(
    (row) =>
      normalise(row['Examination code']) === exam.examinationCode &&
      normalise(row.Qual) === exam.qualification &&
      pearsonDate(row.Date) === exam.date &&
      normalise(row.Title) === normalise(exam.title) &&
      normalise(row.Subject) === normalise(exam.subject) &&
      normalise(row.Unit) === exam.unit &&
      normalise(row.Time) === exam.session &&
      normalise(row.Duration) === exam.duration,
  );
  if (matches.length !== 1)
    throw new Error(
      `${exam.examinationCode} ${exam.date}: expected one exact source match, found ${matches.length}`,
    );
  const row = matches[0];
  const windowStart = pearsonDate(row['Window start']);
  const windowEnd = pearsonDate(row['Window end']);
  if (windowStart && windowEnd && windowEnd < windowStart)
    throw new Error(`Reversed window for ${exam.id}`);
  return {
    windowStart,
    windowEnd,
    releaseDate: pearsonDate(row['Release Date']),
    submissionDeadline: pearsonDate(row['Submission deadline']),
    part: normalise(row.Part),
    language: normalise(row.Language),
    windowNotes: normalise(row.Notes),
    windowSource: pearsonOverview,
  };
}
