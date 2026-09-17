import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  LockKeyhole,
  Plus,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { Booking } from '../types';
import { exams } from '../lib/exams';
import { bookingFields } from '../config/fields';
import {
  arrangementText,
  isPopulated,
  newBooking,
  newLearner,
  validateBooking,
} from '../lib/booking';
import { ExamSelector } from '../components/booking/ExamSelector';
import { LearnerCard } from '../components/booking/LearnerCard';
import { FieldInput } from '../components/FieldInput';
import { ExamSummary } from '../components/ExamSummary';
import { Modal } from '../components/Modal';

export function BookingView({
  booking,
  setBooking,
  onCalendar,
}: {
  booking: Booking;
  setBooking: (booking: Booking) => void;
  onCalendar: () => void;
}) {
  const [showErrors, setShowErrors] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [removeId, setRemoveId] = useState('');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [exportError, setExportError] = useState('');
  const [documentDownload, setDocumentDownload] = useState<{ url: string; filename: string }>();
  useEffect(
    () => () => {
      if (documentDownload) URL.revokeObjectURL(documentDownload.url);
    },
    [documentDownload],
  );
  const exam = exams.find((e) => e.id === booking.examId);
  const errors = validateBooking(booking, exam);
  const arrangementCount = booking.learners.filter((l) => l.arrangements.length).length;
  const update = (patch: Partial<Booking>) => {
    setBooking({ ...booking, ...patch });
    setNotice('');
    setExportError('');
    setDocumentDownload(undefined);
  };
  const clear = () => {
    setBooking(newBooking());
    setShowErrors(false);
    setConfirmClear(false);
    setNotice('Booking cleared.');
    setDocumentDownload(undefined);
  };
  async function download() {
    if (!exam || errors.length) {
      setShowErrors(true);
      return;
    }
    setBusy(true);
    setExportError('');
    try {
      const { generateBookingDocument } = await import('../services/generateBookingDocument');
      setDocumentDownload(await generateBookingDocument(booking, exam));
      setNotice(
        'Word document generated. Check your downloads. Your booking remains available until you clear or close this page.',
      );
      setReview(false);
    } catch {
      setExportError(
        'The Word document could not be generated. Check that the template is available, then try again. Your entries are still here.',
      );
    } finally {
      setBusy(false);
    }
  }
  function startReview() {
    setShowErrors(true);
    if (!errors.length) setReview(true);
    else {
      requestAnimationFrame(() => {
        const target = document.getElementById(errors[0].target);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target?.focus();
      });
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow pink-text">Assessment requests</div>
          <h1>
            Book an exam<span className="pink-text">.</span>
          </h1>
          <p>Select an assessment. Add your learners. Download the College form.</p>
        </div>
        <button
          className="secondary"
          onClick={() => (isPopulated(booking) ? setConfirmClear(true) : clear())}
        >
          <RotateCcw size={16} /> Clear booking
        </button>
      </div>
      <div className="booking-layout">
        <div className="booking-main">
          <section className="panel">
            <div className="section-heading">
              <span className="step-number">01</span>
              <div>
                <h2>Select the exam</h2>
                <p>Assessment details come straight from the timetable.</p>
              </div>
              {exam && (
                <button className="text-button push-right" onClick={() => update({ examId: '' })}>
                  Change exam
                </button>
              )}
            </div>
            {exam ? (
              <ExamSummary exam={exam} />
            ) : (
              <ExamSelector onSelect={(id) => update({ examId: id })} onCalendar={onCalendar} />
            )}
          </section>
          <section className="panel">
            <div className="section-heading">
              <span className="step-number">02</span>
              <div>
                <h2>Booking information</h2>
                <p>
                  The details needed by the exams team. <span className="muted">* Required</span>
                </p>
              </div>
            </div>
            <div className="form-grid">
              {bookingFields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  id={`booking-${field.key}`}
                  value={booking.info[field.key] ?? ''}
                  onChange={(value) => update({ info: { ...booking.info, [field.key]: value } })}
                  error={
                    showErrors || field.type === 'time'
                      ? errors.find((e) => e.target === `booking-${field.key}`)?.message
                      : undefined
                  }
                />
              ))}
            </div>
            <p className="field-note">
              The signature and “Exams Use” sections remain available for completion in Word.
            </p>
          </section>
          <section className="panel learners-panel">
            <div className="section-heading">
              <span className="step-number">03</span>
              <div>
                <h2>Add learners</h2>
                <p>
                  {booking.learners.length} learner{booking.learners.length === 1 ? '' : 's'} ·{' '}
                  {arrangementCount} with access arrangements
                </p>
              </div>
              <Users size={20} className="push-right muted" />
            </div>
            <div className="privacy-note">
              <LockKeyhole size={18} />
              <div>
                <strong>Private session</strong>
                <span>
                  Learner information stays in this tab and is cleared when you refresh or close the
                  page.
                </span>
              </div>
            </div>
            <div className="learner-list">
              {booking.learners.map((learner, index) => (
                <LearnerCard
                  key={learner.id}
                  learner={learner}
                  index={index}
                  count={booking.learners.length}
                  errors={showErrors ? errors : []}
                  onChange={(value) =>
                    update({
                      learners: booking.learners.map((l) => (l.id === value.id ? value : l)),
                    })
                  }
                  onRemove={() => setRemoveId(learner.id)}
                  onMove={(offset) => {
                    const learners = [...booking.learners];
                    [learners[index], learners[index + offset]] = [
                      learners[index + offset],
                      learners[index],
                    ];
                    update({ learners });
                  }}
                />
              ))}
            </div>
            {!booking.learners.length && (
              <div className="empty-learners">
                <Users size={28} />
                <h3>Your learner list starts here</h3>
                <p>Add each learner once, then tick their access arrangements.</p>
              </div>
            )}
            <button
              id="add-learner"
              className="add-learner"
              onClick={() => {
                const learner = newLearner();
                update({ learners: [...booking.learners, learner] });
                setTimeout(() => document.getElementById(`${learner.id}-name`)?.focus(), 0);
              }}
            >
              <Plus size={18} /> Add learner
            </button>
          </section>
        </div>
        <aside className="booking-sidebar">
          <div className="panel summary-panel">
            <div className="summary-icon">
              <FileText size={22} />
            </div>
            <div className="eyebrow">Ready when you are</div>
            <h2>Your booking</h2>
            {exam ? (
              <>
                <strong className="sidebar-title">{exam.title}</strong>
                <p className="muted">
                  {exam.unit} · {exam.examinationCode}
                </p>
              </>
            ) : (
              <p className="muted">Choose an exam to start your request.</p>
            )}
            <div className="summary-stats">
              <div>
                <strong>{String(booking.learners.length).padStart(2, '0')}</strong>
                <span>Learners</span>
              </div>
              <div>
                <strong className="cyan-text">{String(arrangementCount).padStart(2, '0')}</strong>
                <span>With arrangements</span>
              </div>
            </div>
            <ol className="checklist">
              <li className={exam ? 'complete' : ''}>
                <Check size={15} /> Exam selected
              </li>
              <li className={booking.info.requestedBy.trim() ? 'complete' : ''}>
                <Check size={15} /> Requester added
              </li>
              <li
                className={
                  booking.learners.length &&
                  !errors.some((e) => booking.learners.some((l) => e.target.startsWith(l.id)))
                    ? 'complete'
                    : ''
                }
              >
                <Check size={15} /> Learners checked
              </li>
            </ol>
            {booking.info.notes && <p className="summary-notes">{booking.info.notes}</p>}
            <button className="primary full-width" onClick={startReview}>
              Review & generate <ArrowRight size={17} />
            </button>
            {documentDownload && (
              <a
                className="download-link"
                href={documentDownload.url}
                download={documentDownload.filename}
              >
                <Download size={16} /> Download Word document
              </a>
            )}
            <p className="export-caption">
              Downloads a Word document using the College request form.
            </p>
            {showErrors && errors.length > 0 && (
              <div className="validation" role="alert">
                <strong>Complete these details</strong>
                <ul>
                  {errors.map((e) => (
                    <li key={e.target}>
                      <button
                        onClick={() => {
                          document
                            .getElementById(e.target)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          document.getElementById(e.target)?.focus();
                        }}
                      >
                        {e.message}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="sidebar-note">
            <ShieldCheck size={20} />
            <p>
              <strong>Nothing entered here is saved</strong>Your downloaded document contains the
              booking. Keep it in an appropriate College location.
            </p>
          </div>
        </aside>
      </div>
      {notice && (
        <div className="notice" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      {exportError && !review && (
        <p className="validation" role="alert">
          {exportError}
        </p>
      )}
      {confirmClear && (
        <Modal title="Clear this booking?" onClose={() => setConfirmClear(false)}>
          <p>
            All booking details and learners will be removed from this tab. This cannot be undone.
          </p>
          <div className="modal-actions">
            <button onClick={() => setConfirmClear(false)}>Keep booking</button>
            <button className="danger-button" onClick={clear}>
              Clear booking
            </button>
          </div>
        </Modal>
      )}
      {removeId && (
        <Modal title="Remove this learner?" onClose={() => setRemoveId('')}>
          <p>The learner and their access arrangements will be removed from this booking.</p>
          <div className="modal-actions">
            <button onClick={() => setRemoveId('')}>Keep learner</button>
            <button
              className="danger-button"
              onClick={() => {
                update({ learners: booking.learners.filter((l) => l.id !== removeId) });
                setRemoveId('');
              }}
            >
              Remove learner
            </button>
          </div>
        </Modal>
      )}
      {review && exam && (
        <Modal
          title="Review your booking"
          onClose={() => {
            if (!busy) setReview(false);
          }}
          wide
        >
          <ExamSummary exam={exam} />
          <p className="review-total">
            {booking.learners.length} learner{booking.learners.length === 1 ? '' : 's'} ·{' '}
            {arrangementCount} with access arrangements
          </p>
          <dl className="review-info">
            {bookingFields
              .filter((f) => booking.info[f.key]?.trim())
              .map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>{booking.info[f.key]}</dd>
                </div>
              ))}
          </dl>
          <div className="review-learners">
            {booking.learners.map((l, i) => (
              <div key={l.id}>
                <strong>
                  {i + 1}. {l.name}
                </strong>
                <span>
                  {l.candidateId} · Readiness: {l.ready || 'Not confirmed'}
                  {l.resit ? ` · Resit ${l.resitNumber}` : ''}
                </span>
                <p>{arrangementText(l) || 'No access arrangements'}</p>
                {l.notes && <p className="muted">{l.notes}</p>}
              </div>
            ))}
          </div>
          {exportError && (
            <p className="validation" role="alert">
              {exportError}
            </p>
          )}
          <div className="modal-actions">
            <button disabled={busy} onClick={() => setReview(false)}>
              Back to editing
            </button>
            <button className="primary" disabled={busy} onClick={download}>
              <Download size={17} />
              {busy ? 'Generating…' : 'Generate Word document'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
