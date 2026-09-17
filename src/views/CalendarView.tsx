import { TimetableFilters } from '../components/calendar/TimetableFilters';
import { useState } from 'react';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, List, Search } from 'lucide-react';
import type { Exam } from '../types';
import {
  academicYear,
  emptyFilters,
  exams,
  filterExams,
  upcomingExams,
  type Filters,
} from '../lib/exams';
import { formatDate, localDate, monthTitle, shiftMonth } from '../lib/dates';
import { MonthGrid } from '../components/calendar/MonthGrid';
import { EventDetails } from '../components/calendar/EventDetails';
import { Modal } from '../components/Modal';
import { ExamBadges } from '../components/ExamSummary';

export function EventRow({ exam, onClick }: { exam: Exam; onClick: () => void }) {
  return (
    <button className="list-event" onClick={onClick}>
      <span className="date-tile">
        <strong>{Number(exam.date.slice(-2))}</strong>
        <span>{formatDate(exam.date, { month: 'short' })}</span>
      </span>
      <span className="list-event-main">
        <span className="result-subject">
          {exam.subject} · {exam.unit}
        </span>
        <strong>{exam.title}</strong>
        <span className="muted">
          {exam.examinationCode} · {exam.duration} · {exam.examSeries}
        </span>
      </span>
      <ExamBadges exam={exam} />
      <ArrowRight size={17} />
    </button>
  );
}
export function CalendarView({ onBook }: { onBook: (id: string) => void }) {
  const today = localDate();
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });
  const [month, setMonth] = useState(() =>
    (exams.find((e) => e.date >= today)?.date ?? exams.at(-1)?.date ?? today).slice(0, 7),
  );
  const [mode, setMode] = useState<'month' | 'list'>('month');
  const [selected, setSelected] = useState<Exam>();
  const [day, setDay] = useState('');
  const filtered = filterExams(exams, filters);
  const upcoming = upcomingExams(filtered, today);
  const inMonth = filtered.filter((e) => e.date.startsWith(month));
  const months = [...new Set(filtered.map((e) => e.date.slice(0, 7)))];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow cyan-text">College examination timetable</div>
          <h1>
            Track the year<span className="cyan-text">.</span>
          </h1>
          <p>Every assessment, in one place. Find an exam and start a booking.</p>
        </div>
        <span className="year-pill">
          <CalendarDays size={16} />
          {academicYear}
        </span>
      </div>
      <div className="calendar-layout">
        <TimetableFilters filters={filters} setFilters={setFilters} />
        <section className="panel calendar-panel">
          <div className="calendar-toolbar">
            <div className="month-navigation">
              <button
                className="icon-button"
                onClick={() => setMonth(shiftMonth(month, -1))}
                aria-label="Previous month"
                disabled={mode === 'list'}
              >
                <ChevronLeft size={21} />
              </button>
              <h2>{mode === 'month' ? monthTitle(month) : 'Academic year'}</h2>
              <button
                className="icon-button"
                onClick={() => setMonth(shiftMonth(month, 1))}
                aria-label="Next month"
                disabled={mode === 'list'}
              >
                <ChevronRight size={21} />
              </button>
            </div>
            <div className="view-toggle" aria-label="Calendar view">
              <button
                aria-pressed={mode === 'month'}
                className={mode === 'month' ? 'active' : ''}
                onClick={() => setMode('month')}
              >
                <CalendarDays size={15} /> Month
              </button>
              <button
                aria-pressed={mode === 'list'}
                className={mode === 'list' ? 'active' : ''}
                onClick={() => setMode('list')}
              >
                <List size={16} /> Subject / List
              </button>
            </div>
          </div>
          <div className="calendar-caption">
            <span aria-live="polite">
              {mode === 'month'
                ? `${inMonth.length} event${inMonth.length === 1 ? '' : 's'} this month · `
                : ''}
              {filtered.length} matching events across the year
            </span>
            <button
              className="text-button"
              disabled={!upcoming.length}
              onClick={() => {
                setMonth(upcoming[0].date.slice(0, 7));
                setMode('month');
              }}
            >
              Jump to next exam <ArrowRight size={14} />
            </button>
          </div>
          {mode === 'month' ? (
            <>
              <MonthGrid month={month} exams={filtered} onEvent={setSelected} onDay={setDay} />
              {!inMonth.length && (
                <div className="month-empty">
                  <span>No matching events in {monthTitle(month)}.</span>
                  {months.length > 0 && (
                    <button
                      className="text-button"
                      onClick={() =>
                        setMonth(months.find((m) => m >= month) ?? months[months.length - 1])
                      }
                    >
                      Show a month with results <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="year-list">
              {months.map((m) => (
                <section key={m}>
                  <h3>
                    {monthTitle(m)}
                    <span>{filtered.filter((e) => e.date.startsWith(m)).length} events</span>
                  </h3>
                  {filtered
                    .filter((e) => e.date.startsWith(m))
                    .map((e) => (
                      <EventRow key={e.id} exam={e} onClick={() => setSelected(e)} />
                    ))}
                </section>
              ))}
              {!filtered.length && (
                <div className="empty-state">
                  <Search />
                  <h3>No matching assessments</h3>
                  <p>Try changing your search or clearing the filters.</p>
                </div>
              )}
            </div>
          )}
          <div className="calendar-legend">
            <span>
              <i className="morning-dot" />
              Morning
            </span>
            <span>
              <i className="afternoon-dot" />
              Afternoon
            </span>
            <span>
              <i className="window-dot" />
              Window / pre-release
            </span>
            <small>Dates from the timetable. No exact times implied.</small>
          </div>
        </section>
      </div>
      {day && !selected && (
        <Modal title={formatDate(day)} onClose={() => setDay('')} wide>
          <div className="day-list">
            {filtered
              .filter((e) => e.date === day)
              .map((e) => (
                <EventRow
                  key={e.id}
                  exam={e}
                  onClick={() => {
                    setDay('');
                    setSelected(e);
                  }}
                />
              ))}
          </div>
          {!filtered.some((e) => e.date === day) && (
            <p className="muted">No matching events on this day.</p>
          )}
        </Modal>
      )}
      {selected && (
        <EventDetails exam={selected} onClose={() => setSelected(undefined)} onBook={onBook} />
      )}
    </>
  );
}
