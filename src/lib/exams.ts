import records from '../data/exams.json';
import windows from '../data/exam-windows.json';
import type { Exam } from '../types';
export const exams: Exam[] = records.map((exam) => ({
  ...exam,
  ...(windows as Record<string, Partial<Exam>>)[exam.id],
})) as Exam[];
const firstYear =
  Number(exams[0].date.slice(0, 4)) - (Number(exams[0].date.slice(5, 7)) < 8 ? 1 : 0);
export const academicYear = `${firstYear}–${String(firstYear + 1).slice(-2)}`;
export const upcomingExams = (records: Exam[], today: string, count = 5) =>
  records.filter((e) => (e.windowEnd || e.date) >= today).slice(0, count);
export function matchesExam(exam: Exam, query: string) {
  const text = [
    exam.subject,
    exam.title,
    exam.unit,
    exam.examinationCode,
    exam.examSeries,
    exam.qualification,
  ]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .every((word) => text.includes(word));
}
export type Filters = {
  query: string;
  subject: string;
  examSeries: string;
  qualification: string;
  session: string;
};
export const emptyFilters: Filters = {
  query: '',
  subject: '',
  examSeries: '',
  qualification: '',
  session: '',
};
export function filterExams(records: Exam[], filters: Filters) {
  return records.filter(
    (exam) =>
      matchesExam(exam, filters.query) &&
      (['subject', 'examSeries', 'qualification', 'session'] as const).every(
        (key) => !filters[key] || exam[key] === filters[key],
      ),
  );
}
