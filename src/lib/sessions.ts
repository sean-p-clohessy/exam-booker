import type { Booking, BookingSession, Exam } from '../types';
import { validDate } from './windows';
import { formatDate } from './dates';
export const newSession = (): BookingSession => ({
  id: crypto.randomUUID(),
  date: '',
  startTime: '',
  endTime: '',
});
export const bookingSessions = (booking: Booking): BookingSession[] =>
  booking.sessions ?? [
    {
      id: 'first',
      date: booking.info.assessmentDate || '',
      startTime: booking.info.startTime || '',
      endTime: booking.info.endTime || '',
    },
  ];
const timeValid = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const sessionMinutes = (session: BookingSession) =>
  timeValid(session.startTime) && timeValid(session.endTime) && session.endTime > session.startTime
    ? minutes(session.endTime) - minutes(session.startTime)
    : null;
export const totalMinutes = (sessions: BookingSession[]) =>
  sessions.length && sessions.every((s) => sessionMinutes(s) !== null)
    ? sessions.reduce((sum, s) => sum + sessionMinutes(s)!, 0)
    : null;
export const durationLabel = (value: number) => `${Math.floor(value / 60)}h ${value % 60}m`;
export function sessionErrors(sessions: BookingSession[], exam: Exam) {
  const errors: { target: string; message: string }[] = [];
  if (!sessions.length)
    return [{ target: 'add-session', message: 'Add at least one booking session.' }];
  sessions.forEach((s, i) => {
    const add = (field: string, message: string) =>
      errors.push({ target: `session-${s.id}-${field}`, message: `Session ${i + 1}: ${message}` });
    if (!validDate(s.date)) add('date', 'choose a valid date.');
    else if (!exam.windowStart || !exam.windowEnd)
      add('date', 'confirm the missing window dates with the Exams Team.');
    else if (s.date < exam.windowStart || s.date > exam.windowEnd)
      add('date', 'date must fall within the published assessment window.');
    if (!timeValid(s.startTime)) add('startTime', 'enter a valid start time.');
    if (!timeValid(s.endTime)) add('endTime', 'enter a valid end time.');
    else if (timeValid(s.startTime) && s.endTime <= s.startTime)
      add('endTime', 'end time must be after the start time on the same day.');
    if (
      sessionMinutes(s) !== null &&
      sessions
        .slice(0, i)
        .some(
          (p) =>
            p.date === s.date &&
            sessionMinutes(p) !== null &&
            s.startTime < p.endTime &&
            s.endTime > p.startTime,
        )
    )
      add('startTime', 'this session overlaps another session.');
  });
  return errors;
}
export const sessionSchedule = (sessions: BookingSession[]) =>
  sessions
    .map(
      (s, i) =>
        `Session ${i + 1}: ${formatDate(s.date)}, ${s.startTime}–${s.endTime} (${durationLabel(sessionMinutes(s)!)})`,
    )
    .join('\n');
