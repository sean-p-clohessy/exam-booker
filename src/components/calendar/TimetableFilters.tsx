import { Search, SlidersHorizontal, X } from 'lucide-react';
import { exams, emptyFilters, type Filters } from '../../lib/exams';
const filterLabels = {
  subject: 'Subject',
  examSeries: 'Exam series',
  qualification: 'Qualification',
  session: 'Session',
};

export function TimetableFilters({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}) {
  const anyFilter = Object.values(filters).some(Boolean);
  return (
    <section className="panel calendar-filters" aria-label="Filter timetable">
      <div className="filter-top">
        <div className="search-field">
          <label htmlFor="calendar-search" className="sr-only">
            Search timetable
          </label>
          <Search size={19} />
          <input
            id="calendar-search"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder="Search title, subject, code or unit…"
          />
        </div>
        <span className="filter-label">
          <SlidersHorizontal size={17} /> Filters
        </span>
        <button
          className="text-button"
          onClick={() => setFilters({ ...emptyFilters })}
          disabled={!anyFilter}
        >
          <X size={15} /> Clear filters
        </button>
      </div>
      <div className="filter-grid">
        {(Object.keys(filterLabels) as Array<keyof typeof filterLabels>).map((key) => (
          <div className="field" key={key}>
            <label htmlFor={`filter-${key}`}>{filterLabels[key]}</label>
            <select
              id={`filter-${key}`}
              value={filters[key]}
              onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
            >
              <option value="">
                All {filterLabels[key].toLowerCase()}
                {key === 'subject'
                  ? 's'
                  : key === 'qualification'
                    ? 's'
                    : key === 'session'
                      ? 's'
                      : ''}
              </option>
              {[...new Set(exams.map((e) => e[key]))].sort().map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}
