import { accessArrangements } from '../config/accessArrangements';
import { arrangementText, validateBooking } from '../lib/booking';
import { formatDate } from '../lib/dates';
import type { Booking, Exam } from '../types';
const checkbox = (value: boolean) => (value ? '☒' : '☐');
export function buildTemplateData(booking: Booking, exam: Exam) {
  const errors = validateBooking(booking, exam);
  if (errors.length) throw new Error(errors.map((e) => e.message).join(' '));
  const info = Object.fromEntries(
    Object.entries(booking.info).map(([key, value]) => [key, value.trim()]),
  );
  return {
    ...info,
    requestDate: info.requestDate ? formatDate(info.requestDate) : '',
    exam: {
      ...exam,
      code: exam.examinationCode,
      isoDate: exam.date,
      date: formatDate(exam.date),
      eventLabel: exam.eventType === 'preRelease' ? 'Pre-release' : 'Exam',
    },
    examinationName: `${exam.subject} — ${exam.title}\n${exam.unit} · ${exam.examinationCode} · ${exam.qualification}\n${exam.examSeries} · ${exam.eventType === 'preRelease' ? 'Pre-release · ' : ''}${exam.session} · ${exam.duration}`,
    writtenCheckbox: checkbox(info.examType === 'Written'),
    onlineCheckbox: checkbox(info.examType === 'Online'),
    startTime: info.startTime || `${exam.session} (time not specified)`,
    endTime: info.endTime || 'Not specified',
    bookingNotes: [info.cohort ? `Course / cohort: ${info.cohort}` : '', info.notes]
      .filter(Boolean)
      .join('\n'),
    learnerCount: booking.learners.length,
    arrangementCount: booking.learners.filter((l) => l.arrangements.length).length,
    learners: booking.learners.map((learner, index) => ({
      ...learner,
      index: index + 1,
      name: learner.name.trim(),
      candidateId: learner.candidateId.trim(),
      notes: learner.notes.trim(),
      arrangements: [...learner.arrangements],
      hasArrangements: learner.arrangements.length > 0,
      aaCheckbox: checkbox(learner.arrangements.length > 0),
      arrangementText: arrangementText(learner),
      arrangementDetails: [
        arrangementText(learner),
        learner.notes.trim() ? `Notes: ${learner.notes.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      checkboxes: Object.fromEntries(
        accessArrangements.map((a) => [a.id, checkbox(learner.arrangements.includes(a.id))]),
      ),
      resitCheckbox: checkbox(learner.resit),
      resitNumber: learner.resit ? learner.resitNumber : '',
      ready: learner.ready || 'Not confirmed',
    })),
  };
}
export const bookingFilename = (exam: Exam) =>
  `Exam_Booking_${exam.examinationCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_${exam.date}.docx`;
