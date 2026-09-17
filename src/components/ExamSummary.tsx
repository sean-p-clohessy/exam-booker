import { CalendarDays, Clock3, Hash } from 'lucide-react';
import type { Exam } from '../types';
import { formatDate } from '../lib/dates';
import { ExamWindow } from './ExamWindow';
export function ExamBadges({ exam }: { exam: Exam }) {
  return (
    <span className="badges">
      <span className={`badge ${exam.session.toLowerCase()}`}>{exam.session}</span>
      {exam.eventType === 'preRelease' && <span className="badge prerelease">Pre-release</span>}
    </span>
  );
}
export function ExamSummary({ exam }: { exam: Exam }) {
  return (
    <div className="exam-summary">
      <div className="eyebrow">
        {exam.subject} <span> / {exam.unit}</span>
      </div>
      <h3>{exam.title}</h3>
      <p className="muted">{exam.qualification}</p>
      <div className="exam-meta">
        <span>
          <CalendarDays size={16} />
          {exam.session === 'Window' ? 'Timetable date: ' : ''}
          {formatDate(exam.date)}
        </span>
        <span>
          <Hash size={16} />
          {exam.examinationCode}
        </span>
        <span>
          <Clock3 size={16} />
          {exam.duration}
        </span>
      </div>
      <div className="summary-bottom">
        <ExamBadges exam={exam} />
        <span className="mono muted">{exam.examSeries}</span>
      </div>
      <ExamWindow exam={exam} />
    </div>
  );
}
