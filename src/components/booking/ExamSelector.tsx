import { useState } from 'react';
import { Search, ArrowUpRight, CalendarDays } from 'lucide-react';
import { exams, matchesExam } from '../../lib/exams';
import { formatDate } from '../../lib/dates';
import { ExamBadges } from '../ExamSummary';
import { windowLabel } from '../../lib/windows';
export function ExamSelector({
  onSelect,
  onCalendar,
}: {
  onSelect: (id: string) => void;
  onCalendar: () => void;
}) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const matches = exams.filter((e) => matchesExam(e, query) && (!subject || e.subject === subject));
  return (
    <div>
      <div className="selector-tools">
        <div className="search-field">
          <label className="sr-only" htmlFor="exam-search">
            Search exams
          </label>
          <Search size={19} />
          <input
            id="exam-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subject, title, code or unit…"
            autoComplete="off"
          />
        </div>
        <label className="sr-only" htmlFor="booking-subject">
          Subject
        </label>
        <select id="booking-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">All subjects</option>
          {[...new Set(exams.map((e) => e.subject))].sort().map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="results-caption">
        <span aria-live="polite">{matches.length} matching events</span>
        <button className="text-button" onClick={onCalendar}>
          <CalendarDays size={14} /> Browse calendar
        </button>
      </div>
      <div className="exam-results">
        {matches.map((exam) => (
          <button className="exam-result" key={exam.id} onClick={() => onSelect(exam.id)}>
            <div>
              <span className="result-subject">
                {exam.subject} <span className="muted">· {exam.unit}</span>
              </span>
              <strong>{exam.title}</strong>
              {exam.session === 'Window' && (
                <span className="result-meta">
                  {exam.part ? `${exam.part} · ` : ''}
                  {windowLabel(exam)}
                </span>
              )}
              <span className="result-meta">
                {exam.examinationCode} · {formatDate(exam.date)} · {exam.duration} ·{' '}
                {exam.examSeries}
              </span>
            </div>
            <span className="result-right">
              <ExamBadges exam={exam} />
              <ArrowUpRight size={18} />
            </span>
          </button>
        ))}
        {!matches.length && (
          <div className="empty-state">
            <Search />
            <h3>No exams match your search</h3>
            <p>Try a shorter title, a code, or another subject.</p>
            <button
              onClick={() => {
                setQuery('');
                setSubject('');
              }}
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
