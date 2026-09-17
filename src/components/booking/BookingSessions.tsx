import type { BookingSession, Exam } from '../../types';
import { newSession, totalMinutes, durationLabel } from '../../lib/sessions';
export function BookingSessions({
  sessions,
  exam,
  onChange,
  errors,
  showErrors,
}: {
  sessions: BookingSession[];
  exam: Exam;
  onChange: (sessions: BookingSession[]) => void;
  errors: { target: string; message: string }[];
  showErrors: boolean;
}) {
  const total = totalMinutes(sessions);
  return (
    <section className="booking-sessions" aria-label="Booking sessions">
      <h3>Booking sessions</h3>
      <p className="field-note">
        One booking for all sessions. Session numbers are local labels, separate from Pearson’s
        assessment parts.
      </p>
      {sessions.map((s, i) => (
        <fieldset className="session-row" key={s.id}>
          <legend>Session {i + 1}</legend>
          <div className="form-grid">
            {(['date', 'startTime', 'endTime'] as const).map((key) => {
              const id = `session-${s.id}-${key}`;
              const error =
                showErrors || s[key] ? errors.find((e) => e.target === id)?.message : undefined;
              return (
                <div className="field" key={key}>
                  <label htmlFor={id}>
                    {key === 'date' ? 'Date' : key === 'startTime' ? 'Start time' : 'End time'} *
                  </label>
                  <input
                    id={id}
                    required
                    type={key === 'date' ? 'date' : 'time'}
                    value={s[key]}
                    min={key === 'date' ? exam.windowStart : undefined}
                    max={key === 'date' ? exam.windowEnd : undefined}
                    onChange={(e) =>
                      onChange(
                        sessions.map((row) =>
                          row.id === s.id ? { ...row, [key]: e.target.value } : row,
                        ),
                      )
                    }
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                  />
                  {error && (
                    <p className="field-error" id={`${id}-error`}>
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {sessions.length > 1 && (
            <button
              className="text-button"
              onClick={() => onChange(sessions.filter((row) => row.id !== s.id))}
            >
              Remove session {i + 1}
            </button>
          )}
        </fieldset>
      ))}
      <button id="add-session" onClick={() => onChange([...sessions, newSession()])}>
        Add another session
      </button>
      <p aria-live="polite">
        <strong>
          {total === null
            ? 'Complete session times to calculate the total'
            : `Combined time: ${durationLabel(total)}`}
        </strong>
        <span className="muted"> · Timetable duration: {exam.duration}</span>
      </p>
      <p className="field-note">
        Check the total against the assessment requirements. Individual extra time and rest breaks
        are recorded under learner arrangements.
      </p>
    </section>
  );
}
