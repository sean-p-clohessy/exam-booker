export interface Field {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'time' | 'date' | 'select';
  options?: string[];
  required?: boolean;
  hint?: string;
}

export const bookingFields: Field[] = [
  { key: 'requestedBy', label: 'Requested by', required: true },
  { key: 'programmeArea', label: 'Programme area' },
  { key: 'cohort', label: 'Course / cohort' },
  { key: 'requestDate', label: 'Request date', type: 'date' },
  { key: 'location', label: 'Location' },
  { key: 'invigilator', label: 'Invigilator', hint: 'Must not teach the subject.' },
  { key: 'examType', label: 'Exam type', type: 'select', options: ['Written', 'Online'] },
  {
    key: 'awardingBody',
    label: 'Awarding body / scheme no.',
    hint: 'Enter the confirmed awarding body or scheme number.',
  },
  {
    key: 'startTime',
    label: 'Confirmed start time',
    type: 'time',
    hint: 'Optional. The timetable does not specify a clock time.',
  },
  { key: 'endTime', label: 'Confirmed end time', type: 'time' },
  { key: 'notes', label: 'Additional booking notes', type: 'textarea' },
];

export const learnerFields: Field[] = [
  { key: 'name', label: 'Learner name', required: true },
  {
    key: 'candidateId',
    label: 'Student / candidate ID',
    required: true,
    hint: 'Maps to Person Code / D.O.B on the College form.',
  },
  {
    key: 'ready',
    label: 'Confident the learner is ready?',
    type: 'select',
    options: ['Yes', 'No', 'Not yet confirmed'],
  },
  { key: 'notes', label: 'Additional learner notes', type: 'textarea' },
];
