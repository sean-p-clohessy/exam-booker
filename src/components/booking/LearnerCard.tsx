import { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, ChevronDown } from 'lucide-react';
import type { Learner } from '../../types';
import { learnerFields } from '../../config/fields';
import { accessArrangements, extraTimeOptions } from '../../config/accessArrangements';
import { FieldInput } from '../FieldInput';
import type { ValidationError } from '../../lib/booking';
export function LearnerCard({
  learner,
  index,
  count,
  onChange,
  onMove,
  onRemove,
  errors,
}: {
  learner: Learner;
  index: number;
  count: number;
  onChange: (learner: Learner) => void;
  onMove: (offset: number) => void;
  onRemove: () => void;
  errors: ValidationError[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [arrangementsExpanded, setArrangementsExpanded] = useState(false);
  const [customTime, setCustomTime] = useState(!['25', '50'].includes(learner.extraTime));
  const error = (key: string) => errors.find((e) => e.target === `${learner.id}-${key}`)?.message;
  const patch = (values: Partial<Learner>) => onChange({ ...learner, ...values });
  const arrangementsOpen =
    arrangementsExpanded || !!error('extraTime') || !!error('otherArrangement');
  return (
    <article className="learner-card">
      <div className="learner-head">
        <button
          className="learner-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="learner-number">{String(index + 1).padStart(2, '0')}</span>
          <span>
            <strong>{learner.name || `Learner ${String(index + 1).padStart(2, '0')}`}</strong>
            <small>
              {learner.arrangements.length
                ? `${learner.arrangements.length} access arrangement${learner.arrangements.length === 1 ? '' : 's'}`
                : 'No access arrangements selected'}
            </small>
          </span>
          <ChevronDown size={16} className={expanded ? 'rotated' : ''} />
        </button>
        <div className="actions">
          <button
            className="icon-button"
            aria-label={`Move learner ${index + 1} up`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={16} />
          </button>
          <button
            className="icon-button"
            aria-label={`Move learner ${index + 1} down`}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={16} />
          </button>
          <button
            className="icon-button danger"
            aria-label={`Remove learner ${index + 1}`}
            onClick={onRemove}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div
        hidden={!expanded && !errors.some((e) => e.target.startsWith(learner.id))}
        className="learner-body"
      >
        <div className="form-grid">
          {learnerFields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              id={`${learner.id}-${field.key}`}
              value={String(learner[field.key as keyof Learner] ?? '')}
              error={error(field.key)}
              onChange={(value) => patch({ [field.key]: value })}
            />
          ))}
        </div>
        <fieldset className="arrangements">
          <legend>
            <button
              type="button"
              className="arrangements-toggle"
              aria-expanded={arrangementsOpen}
              aria-controls={`${learner.id}-arrangements`}
              onClick={() => setArrangementsExpanded(!arrangementsOpen)}
            >
              Access arrangements
              <span className="muted">{learner.arrangements.length} selected</span>
              <ChevronDown size={16} className={arrangementsOpen ? 'rotated' : ''} />
            </button>
          </legend>
          <div id={`${learner.id}-arrangements`} hidden={!arrangementsOpen}>
            <p className="field-note">
              Record arrangements agreed with the Exams / Learning Support team. Selecting an option
              does not approve it. Use learner notes for the required format, equipment or room
              details. A smaller shared room (sometimes called a quiet room) is not individual
              invigilation. Coloured overlays and coloured question papers are different
              arrangements.
            </p>
            <div className="checkbox-grid">
              {accessArrangements.map((a) => (
                <label
                  key={a.id}
                  className={`check-option ${learner.arrangements.includes(a.id) ? 'checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={learner.arrangements.includes(a.id)}
                    onChange={(e) =>
                      patch({
                        arrangements: e.target.checked
                          ? [...learner.arrangements, a.id]
                          : learner.arrangements.filter((id) => id !== a.id),
                      })
                    }
                  />
                  <span>{a.label}</span>
                </label>
              ))}
            </div>
            <div className="form-grid conditional-fields">
              {learner.arrangements.includes('extraTime') && (
                <>
                  <div className="field">
                    <label htmlFor={`${learner.id}-extraTime-choice`}>Extra time percentage</label>
                    <select
                      id={`${learner.id}-extraTime-choice`}
                      value={customTime ? 'Other' : learner.extraTime}
                      onChange={(e) => {
                        setCustomTime(e.target.value === 'Other');
                        patch({ extraTime: e.target.value === 'Other' ? '' : e.target.value });
                      }}
                    >
                      {extraTimeOptions.map((o) => (
                        <option key={o} value={o}>
                          {o === 'Other' ? o : `${o}%`}
                        </option>
                      ))}
                    </select>
                  </div>
                  {customTime && (
                    <FieldInput
                      field={{ key: 'extraTime', label: 'Custom extra time (%)' }}
                      id={`${learner.id}-extraTime`}
                      value={learner.extraTime}
                      onChange={(value) => patch({ extraTime: value })}
                      error={error('extraTime')}
                    />
                  )}
                </>
              )}
              {learner.arrangements.includes('other') && (
                <FieldInput
                  field={{ key: 'otherArrangement', label: 'Other arrangement details' }}
                  id={`${learner.id}-otherArrangement`}
                  value={learner.otherArrangement}
                  onChange={(value) => patch({ otherArrangement: value })}
                  error={error('otherArrangement')}
                />
              )}
            </div>
          </div>
        </fieldset>
        <div className="resit-row">
          <label className="check-option">
            <input
              type="checkbox"
              checked={learner.resit}
              onChange={(e) => patch({ resit: e.target.checked })}
            />
            This is a resit
          </label>
          {learner.resit && (
            <FieldInput
              field={{ key: 'resitNumber', label: 'Resit number' }}
              id={`${learner.id}-resitNumber`}
              value={learner.resitNumber}
              onChange={(value) => patch({ resitNumber: value })}
              error={error('resitNumber')}
            />
          )}
        </div>
      </div>
    </article>
  );
}
