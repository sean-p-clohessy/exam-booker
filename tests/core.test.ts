import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import PizZip from 'pizzip';
import { clean, excelDate, headers, parseRows } from '../scripts/exam-import';
import { monthDays, shiftMonth } from '../src/lib/dates';
import { exams, emptyFilters, filterExams, upcomingExams } from '../src/lib/exams';
import { newBooking, newLearner, validateBooking } from '../src/lib/booking';
import { buildTemplateData, bookingFilename } from '../src/services/templateData';
import { renderBookingDocument } from '../src/services/generateBookingDocument';

const row = (date: unknown = 46402, series = 'Jun-27') => [
  ' Computing ',
  series,
  ' RQF BTEC Nationals ',
  '31768H',
  ' Principles of Computer Science ',
  date,
  'Unit 1',
  'Morning',
  '2 hours',
];
const exam = exams.find((e) => e.examinationCode === '31768H' && e.date === '2027-01-15')!;
function validBooking() {
  const booking = newBooking();
  booking.examId = exam.id;
  booking.info.requestedBy = 'Test tutor';
  booking.learners = [
    { ...newLearner(), name: 'Test Learner A', candidateId: 'TEST-001', ready: 'Yes' },
  ];
  return booking;
}
describe('timetable import', () => {
  it('converts Excel dates without local timezone drift, including both date systems', () => {
    expect(excelDate(46301)).toBe('2026-10-06');
    expect(excelDate(1)).toBe('1900-01-01');
    expect(excelDate(61)).toBe('1900-03-01');
    expect(excelDate(0, true)).toBe('1904-01-01');
    expect(excelDate(new Date('2027-05-26T00:00:00Z'))).toBe('2027-05-26');
    expect(() => excelDate(60)).toThrow('nonexistent');
    expect(() => excelDate('2027-02-30')).toThrow('Invalid date');
  });
  it('trims text, ignores separators, sorts by actual dates and preserves series', () => {
    const result = parseRows([
      headers,
      row('2027-05-26'),
      [],
      Array(9).fill('  '),
      row('2026-11-24', 'Pre-release'),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-11-24');
    expect(result[0].eventType).toBe('preRelease');
    expect(result[1].subject).toBe('Computing');
    expect(result[1].title).toBe('Principles of Computer Science');
    expect(result[1].examSeries).toBe('Jun-27');
    expect(clean(' Title  ')).toBe('Title');
  });
  it('retains legitimate repeated records with deterministic unique IDs', () => {
    const rows = [headers, row(), row(), row('2027-05-27')];
    const result = parseRows(rows);
    expect(new Set(result.map((e) => e.id)).size).toBe(3);
    expect(parseRows(rows)).toEqual(result);
  });
  it('reports missing headers and invalid rows', () => {
    expect(() => parseRows([headers.slice(0, 8), row()])).toThrow('Duration');
    expect(() => parseRows([headers, row('not a date')])).toThrow('row 2');
  });
  it('matches the supplied workbook count, bounds, sessions and Welsh records', () => {
    expect(exams).toHaveLength(88);
    expect(exams[0].date).toBe('2026-11-24');
    expect(exams.at(-1)!.date).toBe('2027-05-28');
    expect(new Set(exams.map((e) => e.id)).size).toBe(88);
    expect(exams.some((e) => e.title.includes('(Welsh)'))).toBe(true);
    expect(exams.filter((e) => e.subject === 'Computing')).toHaveLength(10);
    expect(exams.every((e, i) => i === 0 || exams[i - 1].date <= e.date)).toBe(true);
    expect(exams.every((e) => Object.values(e).every((v) => v.trim() === v))).toBe(true);
  });
});
describe('calendar', () => {
  it('shows only future events and does not wrap after the timetable ends', () => {
    expect(upcomingExams(exams, '2028-01-01')).toEqual([]);
    expect(upcomingExams(exams, '2027-05-28')).toHaveLength(1);
    expect(upcomingExams(exams, '2026-09-16')).toHaveLength(5);
  });
  it('uses Monday-first full weeks across the year boundary and leap years', () => {
    const january = monthDays('2027-01');
    expect(january[0]).toBe('2026-12-28');
    expect(january.at(-1)).toBe('2027-01-31');
    expect(monthDays('2028-02')).toContain('2028-02-29');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2027-01', -1)).toBe('2026-12');
  });
  it('combines text and every dropdown filter without confusing series with month', () => {
    const filtered = filterExams(exams, {
      ...emptyFilters,
      subject: 'Computing',
      examSeries: 'Jun-27',
      qualification: 'RQF BTEC Nationals',
      session: 'Morning',
      query: '31768h science',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].date).toBe('2027-05-26');
    expect(filterExams(exams, { ...emptyFilters, query: 'not-an-exam' })).toHaveLength(0);
  });
});
describe('booking validation and template mapping', () => {
  it.each(['09:00', '14:00'])(
    'blocks an end time of %s for a 14:00 start, including export',
    (endTime) => {
      const booking = validBooking();
      Object.assign(booking.info, { startTime: '14:00', endTime });
      expect(validateBooking(booking, exam)).toContainEqual({
        target: 'booking-endTime',
        message: 'End time must be after the start time on the exam date.',
      });
      expect(() => buildTemplateData(booking, exam)).toThrow('End time must be after');
    },
  );
  it.each([
    ['14:00', '14:01'],
    ['09:00', '14:00'],
    ['', ''],
    ['14:00', ''],
    ['', '16:00'],
  ])('allows valid or optional times (%s, %s)', (startTime, endTime) => {
    const booking = validBooking();
    Object.assign(booking.info, { startTime, endTime });
    expect(validateBooking(booking, exam)).toEqual([]);
  });
  it('revalidates when the start changes and rejects malformed times', () => {
    const booking = validBooking();
    Object.assign(booking.info, { startTime: '09:00', endTime: '14:00' });
    expect(validateBooking(booking, exam)).toEqual([]);
    booking.info.startTime = '15:00';
    expect(validateBooking(booking, exam)[0].target).toBe('booking-endTime');
    booking.info.startTime = '25:00';
    expect(validateBooking(booking, exam)[0].target).toBe('booking-startTime');
  });
  it('rejects missing exam, requester, learners and partially empty learners', () => {
    expect(validateBooking(newBooking()).map((e) => e.target)).toEqual([
      'exam-search',
      'booking-requestedBy',
      'add-learner',
    ]);
    const booking = validBooking();
    booking.learners.push(newLearner());
    expect(validateBooking(booking, exam)).toHaveLength(2);
  });
  it('requires conditional details and rejects invalid extra time and resit numbers', () => {
    const booking = validBooking();
    Object.assign(booking.learners[0], {
      arrangements: ['extraTime', 'other'],
      extraTime: '0',
      resit: true,
    });
    expect(validateBooking(booking, exam)).toHaveLength(3);
  });
  it('maps checkboxes, notes, order and dates without inventing start times', () => {
    const booking = validBooking();
    Object.assign(booking.learners[0], {
      arrangements: ['extraTime', 'reader'],
      extraTime: '50',
      notes: 'Test note',
    });
    const data = buildTemplateData(booking, exam);
    expect(data.exam.date).toBe('15 January 2027');
    expect(data.startTime).toBe('Afternoon (time not specified)');
    expect(data.learners[0].aaCheckbox).toBe('☒');
    expect(data.learners[0].checkboxes.reader).toBe('☒');
    expect(data.learners[0].checkboxes.scribe).toBe('☐');
    expect(data.learners[0].arrangementDetails).toContain('Extra time (50%)');
    expect(data.learners[0].arrangementDetails).toContain('Test note');
    expect(data.learners[0].index).toBe(1);
    expect(bookingFilename({ ...exam, examinationCode: 'BHS03/01' })).toBe(
      'Exam_Booking_BHS03_01_2027-01-15.docx',
    );
  });
  it('renders the actual College template for 25 learners, preserving all non-document parts', () => {
    const template = readFileSync('public/templates/exam-booking-template.docx');
    const booking = validBooking();
    booking.learners = Array.from({ length: 25 }, (_, i) => ({
      ...newLearner(),
      name: `Test Candidate ${i + 1}`,
      candidateId: `T-${i + 1}`,
      arrangements: ['extraTime', 'other'],
      otherArrangement: 'Test <details> & notes',
      notes: 'Long note '.repeat(20),
    }));
    const bytes = renderBookingDocument(template, booking, exam);
    const zip = new PizZip(bytes);
    const xml = zip.file('word/document.xml')!.asText();
    expect(xml).toContain('Test Candidate 25');
    expect(xml).toContain('Test Candidate 1');
    expect(xml).toContain('15 January 2027');
    expect(xml).toContain('Test &lt;details&gt; &amp; notes');
    expect(xml).not.toMatch(/\{[#/a-zA-Z]/);
    expect(xml).not.toContain('undefined');
    const original = new PizZip(readFileSync('src/Exam Request Form 2025.docx'));
    expect(zip.file('word/styles.xml')!.asText()).toBe(original.file('word/styles.xml')!.asText());
  });
});
