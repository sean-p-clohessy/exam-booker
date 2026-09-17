export interface Exam {
  id: string;
  subject: string;
  examSeries: string;
  qualification: string;
  examinationCode: string;
  title: string;
  date: string;
  unit: string;
  session: 'Morning' | 'Afternoon' | 'Window';
  duration: string;
  eventType: 'exam' | 'preRelease';
  windowStart?: string;
  windowEnd?: string;
  releaseDate?: string;
  submissionDeadline?: string;
  part?: string;
  language?: string;
  windowNotes?: string;
  windowSource?: string;
}

export interface Learner {
  id: string;
  name: string;
  candidateId: string;
  notes: string;
  arrangements: string[];
  extraTime: string;
  otherArrangement: string;
  resit: boolean;
  resitNumber: string;
  ready: string;
}
export type BookingInfo = Record<string, string>;
export interface Booking {
  examId: string;
  info: BookingInfo;
  learners: Learner[];
}
