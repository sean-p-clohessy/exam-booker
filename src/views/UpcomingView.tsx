import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { exams, emptyFilters, filterExams, upcomingExams } from '../lib/exams';
import { localDate, formatDate, monthTitle } from '../lib/dates';
import type { Exam } from '../types';
import { TimetableFilters } from '../components/calendar/TimetableFilters';
import { EventDetails } from '../components/calendar/EventDetails';
import { EventRow } from './CalendarView';

export function UpcomingView({ onBook }: { onBook: (id: string) => void }) {
  const [filters, setFilters] = useState({ ...emptyFilters });
  const [selected, setSelected] = useState<Exam>();
  const today = localDate();
  const upcoming = upcomingExams(filterExams(exams, filters), today, exams.length);
  const months = [...new Set(upcoming.map((e) => e.date.slice(0, 7)))];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow green-text">Coming up</div>
          <h1>
            Next on the timetable<span className="green-text">.</span>
          </h1>
          <p>
            From {formatDate(today)}. Open an assessment to see the details and start a booking.
          </p>
        </div>
      </div>
      <div className="calendar-layout">
        <TimetableFilters filters={filters} setFilters={setFilters} />
        <section className="panel calendar-panel" aria-label="Upcoming assessments">
          <div className="calendar-toolbar">
            <h2>Upcoming assessments</h2>
            <span className="muted" aria-live="polite">
              {upcoming.length} matching events
            </span>
          </div>
          <div className="year-list">
            {months.map((month) => (
              <section key={month}>
                <h3>
                  {monthTitle(month)}
                  <span>{upcoming.filter((e) => e.date.startsWith(month)).length} events</span>
                </h3>
                {upcoming
                  .filter((e) => e.date.startsWith(month))
                  .map((exam) => (
                    <EventRow key={exam.id} exam={exam} onClick={() => setSelected(exam)} />
                  ))}
              </section>
            ))}
            {!upcoming.length && (
              <div className="empty-state">
                <CalendarDays />
                <h3>No upcoming assessments</h3>
                <p>Try clearing the filters, or use Calendar to browse earlier events.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      {selected && (
        <EventDetails exam={selected} onClose={() => setSelected(undefined)} onBook={onBook} />
      )}
    </>
  );
}
