import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import PizZip from 'pizzip';
import { matchWindow, pearsonDate } from '../scripts/pearson-windows';
import { exams, upcomingExams } from '../src/lib/exams';
import { newBooking, newLearner, selectExam, validateBooking } from '../src/lib/booking';
import { buildTemplateData, bookingFilename } from '../src/services/templateData';
import { renderBookingDocument } from '../src/services/generateBookingDocument';
import { windowLabel } from '../src/lib/windows';

const windowExam = exams.find((e) => e.examinationCode === '31770H' && e.date === '2027-01-06')!;
function booking(date = '2027-01-10') {
  const result = newBooking();
  result.examId = windowExam.id;
  result.info = { ...result.info, requestedBy: 'Test tutor', assessmentDate: date };
  result.learners = [{ ...newLearner(), name: 'Test Learner', candidateId: 'TEST-01' }];
  return result;
}
describe('Pearson window data', () => {
  it('validates UK dates and rejects impossible dates', () => {
    expect(pearsonDate('06/01/2027')).toBe('2027-01-06');
    expect(pearsonDate('')).toBe('');
    expect(() => pearsonDate('31/02/2027')).toThrow();
  });
  it('requires a unique full event match and keeps the actual window separate from release and deadline', () => {
    const row = {
      'Examination code': '31770H',
      Qual: windowExam.qualification,
      Subject: windowExam.subject,
      Title: windowExam.title,
      Date: '06/01/2027',
      Unit: 'Unit 3',
      Time: 'Window',
      Duration: '3 hours',
      'Window start': '06/01/2027',
      'Window end': '13/01/2027',
      'Release Date': '04/01/2027',
      'Submission deadline': '15/01/2027',
      Part: 'Part A',
    };
    expect(matchWindow(windowExam, [row])).toMatchObject({
      windowStart: '2027-01-06',
      windowEnd: '2027-01-13',
      releaseDate: '2027-01-04',
      submissionDeadline: '2027-01-15',
    });
    expect(() => matchWindow(windowExam, [row, row])).toThrow('found 2');
    expect(() => matchWindow(windowExam, [{ ...row, Duration: '2 hours' }])).toThrow('found 0');
    expect(() => matchWindow(windowExam, [{ ...row, 'Window end': '05/01/2027' }])).toThrow(
      'Reversed',
    );
  });
  it('covers every current window event and preserves different parts', () => {
    expect(exams.filter((e) => e.session === 'Window')).toHaveLength(32);
    expect(
      exams
        .filter((e) => e.session === 'Window')
        .every((e) => e.windowStart && e.windowEnd && e.windowStart <= e.windowEnd),
    ).toBe(true);
    expect(windowExam.windowEnd).toBe('2027-01-13');
    expect(
      exams.find((e) => e.examinationCode === '31770H' && e.date === '2027-01-13')?.windowEnd,
    ).toBe('2027-01-15');
  });
});
describe('booking inside a window', () => {
  it.each(['2027-01-06', '2027-01-10', '2027-01-13'])(
    'accepts %s including both boundaries',
    (date) => {
      expect(validateBooking(booking(date), windowExam)).toEqual([]);
    },
  );
  it.each(['', '2027-01-05', '2027-01-14', '2027-02-30', '2027-1-6'])(
    'blocks invalid or outside date %s including export',
    (date) => {
      expect(
        validateBooking(booking(date), windowExam).some(
          (e) => e.target === 'booking-assessmentDate',
        ),
      ).toBe(true);
      expect(() => buildTemplateData(booking(date), windowExam)).toThrow();
    },
  );
  it('handles a one-day window and unknown dates without guessing', () => {
    const single = { ...windowExam, windowEnd: windowExam.windowStart };
    expect(validateBooking(booking('2027-01-06'), single)).toEqual([]);
    expect(validateBooking(booking('2027-01-07'), single)).toHaveLength(1);
    expect(windowLabel(single)).toContain('one day');
    expect(validateBooking(booking(), { ...windowExam, windowEnd: '' })[0].message).toContain(
      'missing window',
    );
  });
  it('clears the selected date when changing exams but preserves learners', () => {
    const original = booking();
    const changed = selectExam(original, 'another-event');
    expect(changed.info.assessmentDate).toBe('');
    expect(changed.learners).toEqual(original.learners);
    expect(selectExam(original, original.examId).info.assessmentDate).toBe('2027-01-10');
  });
  it('exports the chosen date and window context into the actual Word form', () => {
    const data = buildTemplateData(booking(), windowExam);
    expect(data.exam.date).toBe('10 January 2027');
    expect(data.bookingNotes).toContain('6 January 2027 – 13 January 2027');
    expect(data.bookingNotes).toContain('15 January 2027');
    expect(bookingFilename(windowExam, '2027-01-10')).toContain('2027-01-10.docx');
    const zip = new PizZip(
      renderBookingDocument(
        readFileSync('public/templates/exam-booking-template.docx'),
        booking(),
        windowExam,
      ),
    );
    const xml = zip.file('word/document.xml')!.asText();
    expect(xml).toContain('10 January 2027');
    expect(xml).toContain('13 January 2027');
  });
  it('keeps an open window in Coming up until its final day', () => {
    expect(upcomingExams([windowExam], '2027-01-13')).toEqual([windowExam]);
    expect(upcomingExams([windowExam], '2027-01-14')).toEqual([]);
  });
});
