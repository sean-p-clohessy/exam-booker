import { ArrowRight } from 'lucide-react';
import type { Exam } from '../../types';
import { Modal } from '../Modal';
import { ExamSummary } from '../ExamSummary';
export function EventDetails({
  exam,
  onClose,
  onBook,
}: {
  exam: Exam;
  onClose: () => void;
  onBook: (id: string) => void;
}) {
  return (
    <Modal title="Assessment details" onClose={onClose}>
      <ExamSummary exam={exam} />
      <dl className="review-info">
        <div>
          <dt>Event type</dt>
          <dd>{exam.eventType === 'preRelease' ? 'Pre-release' : 'Examination'}</dd>
        </div>
        <div>
          <dt>Unit / component</dt>
          <dd>{exam.unit}</dd>
        </div>
        <div>
          <dt>Exam series</dt>
          <dd>{exam.examSeries}</dd>
        </div>
      </dl>
      {exam.eventType === 'preRelease' && (
        <p className="window-note">
          This is a pre-release event. Its date is the release date shown in the timetable.
        </p>
      )}
      {exam.session === 'Window' && (
        <p className="window-note">
          This is a window event. Only the supplied timetable date is shown; no end date or exact
          start time is specified.
        </p>
      )}
      <div className="modal-actions">
        <button onClick={onClose}>Close</button>
        <button className="primary" onClick={() => onBook(exam.id)}>
          Book this exam <ArrowRight size={17} />
        </button>
      </div>
    </Modal>
  );
}
