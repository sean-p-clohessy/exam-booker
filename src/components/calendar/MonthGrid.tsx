import type { Exam } from '../../types';
import { formatDate, localDate, monthDays } from '../../lib/dates';
import { ExamBadges } from '../ExamSummary';
export function MonthGrid({
  month,
  exams,
  onEvent,
  onDay,
}: {
  month: string;
  exams: Exam[];
  onEvent: (exam: Exam) => void;
  onDay: (date: string) => void;
}) {
  const byDay = new Map<string, Exam[]>();
  for (const exam of exams) byDay.set(exam.date, [...(byDay.get(exam.date) ?? []), exam]);
  return (
    <div className="calendar-scroll">
      <div className="month-grid">
        <div className="weekdays">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
            (d) => (
              <div key={d}>{d.slice(0, 3)}</div>
            ),
          )}
        </div>
        <div className="calendar-days">
          {monthDays(month).map((date) => {
            const events = byDay.get(date) ?? [];
            const outside = !date.startsWith(month);
            return (
              <div
                key={date}
                className={`calendar-day ${outside ? 'outside' : ''} ${date === localDate() ? 'today' : ''}`}
              >
                <div className="day-heading">
                  <button
                    onClick={() => onDay(date)}
                    aria-label={`${formatDate(date)}, ${events.length} events`}
                    className="day-number"
                  >
                    {Number(date.slice(-2))}
                  </button>
                  {events.length > 0 && (
                    <span>
                      {events.length} {events.length === 1 ? 'event' : 'events'}
                    </span>
                  )}
                </div>
                <div className="day-events">
                  {events.slice(0, 2).map((e) => (
                    <button
                      className={`calendar-event ${e.eventType === 'preRelease' ? 'pre-release-event' : e.session.toLowerCase()}`}
                      key={e.id}
                      onClick={() => onEvent(e)}
                      title={e.title}
                    >
                      <strong>{e.subject}</strong>
                      <span>
                        {e.unit.replace('Unit ', 'U').replace('Component ', 'C')} ·{' '}
                        {e.examinationCode}
                      </span>
                      <ExamBadges exam={e} />
                    </button>
                  ))}
                </div>
                {events.length > 2 && (
                  <button className="more-events" onClick={() => onDay(date)}>
                    + {events.length - 2} more
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
