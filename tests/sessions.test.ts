import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import PizZip from 'pizzip';
import { exams } from '../src/lib/exams';
import { newBooking, newLearner, selectExam, validateBooking } from '../src/lib/booking';
import { newSession, sessionErrors, totalMinutes } from '../src/lib/sessions';
import { buildTemplateData } from '../src/services/templateData';
import { renderBookingDocument } from '../src/services/generateBookingDocument';
const exam = exams.find((e) => e.examinationCode === '31771H' && e.date === '2027-01-05')!;
const sessions = () => [
  { ...newSession(), date: '2027-01-06', startTime: '09:00', endTime: '12:00' },
  { ...newSession(), date: '2027-01-08', startTime: '09:00', endTime: '12:00' },
];
it('exports one booking with both dates and six hours for fifteen learners', () => {
  const booking = { ...newBooking(), examId: exam.id, sessions: sessions() };
  booking.info.requestedBy = 'Test tutor';
  booking.learners = Array.from({ length: 15 }, (_, i) => ({
    ...newLearner(),
    name: `Fictional Learner ${i + 1}`,
    candidateId: String(620001 + i),
  }));
  expect(validateBooking(booking, exam)).toEqual([]);
  expect(totalMinutes(booking.sessions)).toBe(360);
  const data = buildTemplateData(booking, exam);
  expect(data.exam.date).toBe('6 January 2027; 8 January 2027');
  expect(data.startTime).toContain('schedule');
  expect(data.bookingNotes).toContain('Combined time: 6h 0m');
  const xml = new PizZip(
    renderBookingDocument(
      readFileSync('public/templates/exam-booking-template.docx'),
      booking,
      exam,
    ),
  )
    .file('word/document.xml')!
    .asText();
  expect(xml).toContain('Session 1: 6 January 2027');
  expect(xml).toContain('Session 2: 8 January 2027');
  expect(xml).toContain('Fictional Learner 15');
});
it('rejects missing rows, out-of-window dates, malformed times and overlaps', () => {
  expect(sessionErrors([], exam)).toHaveLength(1);
  for (const patch of [
    { date: '2027-01-12' },
    { date: '2027-02-30' },
    { startTime: '' },
    { endTime: '25:00' },
    { endTime: '09:00' },
    { endTime: '08:00' },
  ])
    expect(sessionErrors([{ ...sessions()[0], ...patch }], exam).length).toBeGreaterThan(0);
  const rows = sessions();
  rows[1] = { ...rows[1], date: rows[0].date, startTime: '11:00' };
  expect(sessionErrors(rows, exam).some((e) => e.message.includes('overlaps'))).toBe(true);
  rows[1].startTime = '12:00';
  rows[1].endTime = '15:00';
  expect(sessionErrors(rows, exam)).toEqual([]);
});
it('allows five sessions, inclusive boundaries, and resets sessions on exam change', () => {
  const rows = Array.from({ length: 5 }, (_, i) => ({
    ...newSession(),
    date: `2027-01-${String(5 + i).padStart(2, '0')}`,
    startTime: '09:00',
    endTime: '10:00',
  }));
  expect(sessionErrors(rows, exam)).toEqual([]);
  expect(totalMinutes(rows)).toBe(300);
  rows[4].date = '2027-01-11';
  expect(sessionErrors(rows, exam)).toEqual([]);
  const booking = { ...newBooking(), examId: exam.id, sessions: rows };
  expect(selectExam(booking, exam.id).sessions).toEqual(rows);
  expect(selectExam(booking, 'another').sessions).toHaveLength(1);
  expect(selectExam(booking, 'another').sessions![0].date).toBe('');
});
