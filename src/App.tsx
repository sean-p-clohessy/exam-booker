import { useState } from 'react';
import { CalendarDays, FilePenLine, LockKeyhole } from 'lucide-react';
import { BookingView } from './views/BookingView';
import { UpcomingView } from './views/UpcomingView';
import { CalendarView } from './views/CalendarView';
import { newBooking } from './lib/booking';
import { academicYear } from './lib/exams';
export default function App() {
  const [view, setView] = useState<'booking' | 'calendar' | 'upcoming'>('booking');
  const [booking, setBooking] = useState(newBooking);
  const TimetableView = view === 'upcoming' ? UpcomingView : CalendarView;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">
            <FilePenLine size={24} />
          </div>
          <div>
            <strong>Exam Booker</strong>
            <span>Book assessments. Track the year.</span>
          </div>
          <span className="toolkit-label">STAFF TOOLKIT</span>
        </div>
        <div className="privacy-indicator">
          <span className="status-dot" />
          <LockKeyhole size={13} /> Nothing entered here is saved
        </div>
      </header>
      <div className="nav-bar">
        <nav aria-label="Main navigation">
          <button
            aria-current={view === 'booking' ? 'page' : undefined}
            className={view === 'booking' ? 'active' : ''}
            onClick={() => setView('booking')}
          >
            <FilePenLine size={17} /> Booking
            {booking.learners.length > 0 && (
              <span className="nav-count">{booking.learners.length}</span>
            )}
          </button>
          <button
            aria-current={view === 'calendar' ? 'page' : undefined}
            className={view === 'calendar' ? 'active' : ''}
            onClick={() => setView('calendar')}
          >
            <CalendarDays size={17} /> Calendar
          </button>
          <button
            aria-current={view === 'upcoming' ? 'page' : undefined}
            className={view === 'upcoming' ? 'active' : ''}
            onClick={() => setView('upcoming')}
          >
            <CalendarDays size={17} /> Coming up
          </button>
        </nav>
        <span className="nav-note">
          BTEC EXAMINATIONS <span>/</span> {academicYear}
        </span>
      </div>
      <main id="main">
        {view === 'booking' ? (
          <BookingView
            booking={booking}
            setBooking={setBooking}
            onCalendar={() => setView('calendar')}
          />
        ) : (
          <TimetableView
            onBook={(examId) => {
              setBooking({ ...booking, examId });
              setView('booking');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>
      <footer>
        <span>
          Exam Booker <span className="footer-divider">/</span> College assessment toolkit
        </span>
        <span>Session only. No learner data stored.</span>
      </footer>
    </>
  );
}
