import { useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
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
const filterLabels = {
  subject: 'Subject',
  examSeries: 'Exam series',
  qualification: 'Qualification',
  session: 'Session',
};

function EventRow({ exam, onClick }: { exam: Exam; onClick: () => void }) {
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
  const anyFilter = Object.values(filters).some(Boolean);
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
      <section className="panel calendar-filters" aria-label="Filter timetable">
        <div className="filter-top">
          <div className="search-field">
            <label htmlFor="calendar-search" className="sr-only">
              Search timetable
            </label>
            <Search size={19} />
            <input
              id="calendar-search"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder="Search title, subject, code or unit…"
            />
          </div>
          <span className="filter-label">
            <SlidersHorizontal size={17} /> Filters
          </span>
          <button
            className="text-button"
            onClick={() => setFilters({ ...emptyFilters })}
            disabled={!anyFilter}
          >
            <X size={15} /> Clear filters
          </button>
        </div>
        <div className="filter-grid">
          {(Object.keys(filterLabels) as Array<keyof typeof filterLabels>).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={`filter-${key}`}>{filterLabels[key]}</label>
              <select
                id={`filter-${key}`}
                value={filters[key]}
                onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
              >
                <option value="">
                  All {filterLabels[key].toLowerCase()}
                  {key === 'subject'
                    ? 's'
                    : key === 'qualification'
                      ? 's'
                      : key === 'session'
                        ? 's'
                        : ''}
                </option>
                {[...new Set(exams.map((e) => e[key]))].sort().map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>
      <div className="calendar-layout">
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
        <aside className="upcoming-sidebar">
          <div className="panel upcoming-panel">
            <div className="eyebrow green-text">Coming up</div>
            <h2>Next on the timetable</h2>
            <p className="muted upcoming-caption">
              From {formatDate(today, { day: 'numeric', month: 'short', year: 'numeric' })}
              {anyFilter ? ' · Filters applied' : ''}
            </p>
            {upcoming.length ? (
              upcoming.map((e) => (
                <button className="upcoming-event" key={e.id} onClick={() => setSelected(e)}>
                  <span className="upcoming-date">
                    {formatDate(e.date, { day: 'numeric', month: 'short' })}
                    <ArrowRight size={14} />
                  </span>
                  <strong>{e.subject}</strong>
                  <span>{e.title}</span>
                  <span className="muted">
                    {e.unit} · {e.examinationCode}
                  </span>
                  <ExamBadges exam={e} />
                </button>
              ))
            ) : (
              <div className="empty-upcoming">
                <CalendarDays size={24} />
                <p>
                  No upcoming events
                  {anyFilter ? ' match these filters' : ' in the loaded timetable'}.
                </p>
              </div>
            )}
          </div>
          <div className="sidebar-note">
            <CalendarDays size={21} />
            <p>
              <strong>Find it. Book it.</strong>Open any assessment to see its full details and book
              that exact event.
            </p>
          </div>
        </aside>
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
