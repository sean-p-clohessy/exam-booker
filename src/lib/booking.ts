import { bookingFields, learnerFields } from '../config/fields';
import { accessArrangements } from '../config/accessArrangements';
import type { Booking, Exam, Learner } from '../types';
import { localDate } from './dates';
import { validDate } from './windows';
export const selectExam = (booking: Booking, examId: string): Booking => ({
  ...booking,
  examId,
  info: {
    ...booking.info,
    assessmentDate: examId === booking.examId ? (booking.info.assessmentDate ?? '') : '',
  },
});
export const newBooking = (): Booking => ({
  examId: '',
  info: Object.fromEntries(
    bookingFields.map((field) => [field.key, field.key === 'requestDate' ? localDate() : '']),
  ),
  learners: [],
});
export const newLearner = (): Learner => ({
  id: crypto.randomUUID(),
  name: '',
  candidateId: '',
  notes: '',
  arrangements: [],
  extraTime: '25',
  otherArrangement: '',
  resit: false,
  resitNumber: '',
  ready: '',
});
export const isPopulated = (booking: Booking) =>
  !!booking.examId ||
  booking.learners.length > 0 ||
  Object.entries(booking.info).some(([key, value]) => key !== 'requestDate' && value.trim());
export const arrangementText = (learner: Learner) =>
  accessArrangements
    .filter((a) => learner.arrangements.includes(a.id))
    .map((a) =>
      a.id === 'extraTime'
        ? `${a.label} (${learner.extraTime}%)`
        : a.id === 'other'
          ? `Other: ${learner.otherArrangement.trim()}`
          : a.label,
    )
    .join('; ');
export interface ValidationError {
  target: string;
  message: string;
}
export function validateBooking(booking: Booking, exam?: Exam): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!exam || exam.id !== booking.examId)
    errors.push({ target: 'exam-search', message: 'Select an exam.' });
  for (const field of bookingFields)
    if (field.required && !booking.info[field.key]?.trim())
      errors.push({ target: `booking-${field.key}`, message: `${field.label} is required.` });
  const { startTime, endTime } = booking.info;
  if (exam?.session === 'Window') {
    const date = booking.info.assessmentDate ?? '';
    const message = !validDate(date)
      ? 'Choose a valid booking date for this window.'
      : !exam.windowStart || !exam.windowEnd
        ? 'Confirm the missing window dates with the Exams Team before generating this booking.'
        : date < exam.windowStart || date > exam.windowEnd
          ? 'Booking date must fall within the published assessment window.'
          : '';
    if (message) errors.push({ target: 'booking-assessmentDate', message });
  }
  for (const key of ['startTime', 'endTime'] as const) {
    if (booking.info[key] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(booking.info[key]))
      errors.push({ target: `booking-${key}`, message: 'Enter a valid time in HH:MM format.' });
  }
  // Both optional clock times refer to the selected exam date, not an overnight range.
  if (
    startTime &&
    endTime &&
    !errors.some((e) => ['booking-startTime', 'booking-endTime'].includes(e.target)) &&
    endTime <= startTime
  )
    errors.push({
      target: 'booking-endTime',
      message: 'End time must be after the start time on the exam date.',
    });
  if (!booking.learners.length)
    errors.push({ target: 'add-learner', message: 'Add at least one learner.' });
  booking.learners.forEach((learner, index) => {
    const add = (key: string, message: string) =>
      errors.push({ target: `${learner.id}-${key}`, message: `Learner ${index + 1}: ${message}` });
    for (const field of learnerFields)
      if (field.required && !String(learner[field.key as keyof Learner] ?? '').trim())
        add(field.key, `${field.label} is required.`);
    if (
      learner.arrangements.includes('extraTime') &&
      (!/^\d+(\.\d+)?$/.test(learner.extraTime) ||
        Number(learner.extraTime) <= 0 ||
        Number(learner.extraTime) > 1000)
    )
      add('extraTime', 'enter a valid extra-time percentage (greater than 0, up to 1000).');
    if (learner.arrangements.includes('other') && !learner.otherArrangement.trim())
      add('otherArrangement', 'describe the other access arrangement.');
    if (learner.resit && (!/^\d+$/.test(learner.resitNumber) || Number(learner.resitNumber) < 1))
      add('resitNumber', 'enter the resit number.');
  });
  return errors;
}
