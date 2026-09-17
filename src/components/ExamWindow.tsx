import type { Exam } from '../types';
import { formatDate } from '../lib/dates';
import { windowLabel } from '../lib/windows';

export function ExamWindow({ exam }: { exam: Exam }) {
  if (exam.session !== 'Window') return null;
  return (
    <section className="assessment-window" aria-label="Assessment window">
      <div className="eyebrow">
        {exam.eventType === 'preRelease' ? 'Pre-release / preparation window' : 'Assessment window'}
        {exam.part ? ` · ${exam.part}` : ''}
      </div>
      <strong className="window-range">{windowLabel(exam)}</strong>
      <p>
        {exam.windowStart && exam.windowEnd
          ? 'Choose session dates within these dates, including the first and last day.'
          : 'Check the permitted dates with the Exams Team before booking. No window has been assumed.'}{' '}
        The assessment duration is {exam.duration}; it is not the length of the window.
      </p>
      <dl className="window-dates">
        {exam.releaseDate && (
          <div>
            <dt>Material release</dt>
            <dd>{formatDate(exam.releaseDate)}</dd>
          </div>
        )}
        {exam.submissionDeadline && (
          <div>
            <dt>Submission deadline</dt>
            <dd>{formatDate(exam.submissionDeadline)}</dd>
          </div>
        )}
      </dl>
      {exam.eventType === 'preRelease' && (
        <p>
          This is the preparation event, not the final assessment. Check the separate assessment
          part before booking.
        </p>
      )}
      {exam.windowNotes && (
        <details>
          <summary>Pearson notes for this part</summary>
          <p>{exam.windowNotes}</p>
        </details>
      )}
      {exam.windowSource && (
        <a href={exam.windowSource} target="_blank" rel="noreferrer">
          Check current Pearson details ↗
        </a>
      )}
    </section>
  );
}
