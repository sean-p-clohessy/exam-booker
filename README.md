# Exam Booker

A desktop-first College assessment tool built with React, TypeScript and Vite. Search the timetable, explore a month calendar or academic-year list, select an exact event, add learners and download a completed Word request form.

Both views consume **one generated dataset**. Booking information and learners exist only in React state. There is no backend, database, analytics, localStorage, sessionStorage or IndexedDB. A refresh or closed tab discards the current booking. The downloaded DOCX is the user's explicit saved copy and contains personal information.

After generation, a **Download Word document** link is also available in the booking summary in case the browser blocks the automatic download. Its temporary in-memory file is released when the booking changes, is cleared, or the Booking view closes.

## Run locally

Use Node.js 22.12+ (Node 24 recommended) and npm:

```sh
npm install
npm run dev
```

Alternatively, use pnpm 11.19 with the checked-in lockfile:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite, normally http://127.0.0.1:5173/. This repository already includes the imported JSON and prepared Word template, so Python and Excel are **not** required to run or build the application.

```sh
npm test
npm run build
npm run preview
```

The production output is `dist/`. Preview it over HTTP rather than opening `index.html` with `file://`.

## Timetable import and next year's update

The supplied source remains at:

`src/BTEC EXAM Timetable for 26-27.xlsx`

Run:

```sh
npm run import:exams
```

Or supply a different workbook path:

```sh
npm run import:exams -- "data/BTEC EXAM Timetable for 27-28.xlsx"
```

The importer uses ExcelJS, reads `Sheet3`, locates the header row, validates the nine required columns, trims text, ignores blank separator rows, preserves series/session values, and writes sorted records to **`src/data/exams.json`**. Required headers are `Subject`, `Exam series`, `Qual`, `Examination code`, `Title`, `Date`, `Unit`, `Time`, and `Duration`. Errors identify the source row. Dates must be real Excel dates/serials or ISO `YYYY-MM-DD` strings. Excel's 1900 and 1904 date systems are supported; the fictitious 1900-02-29 is rejected.

IDs are hashes of normalized record content plus a duplicate occurrence number. Similar codes are not deduplicated. Identical duplicate rows also survive. Calendar dates always come from **Date**, never Exam series. Morning, Afternoon and Window do not imply clock times; window end dates are not invented. Pre-release events have an explicit event type.

For the next academic year:

1. Add the new workbook with the same headers and sheet name (or update `scripts/import-exams.ts` for a renamed sheet).
2. Import it with the command above and inspect the printed count and date bounds.
3. Update the source-specific expected values in `tests/core.test.ts` to match the verified new workbook.
4. Run tests and build, review the calendar, then redeploy `dist/`.

The source currently imports **88 records**, **24 November 2026–28 May 2027**. Computing has ten records, grouped by January, April and May rather than by examination series.

## College Word template

**The active template is `public/templates/exam-booking-template.docx`.** It is derived from the supplied `src/Exam Request Form 2025.docx`; the original is unchanged.

The prepared template keeps the source page geometry, tables, styles, footer, signature and “Exams Use” area. Blank candidate rows become one repeating row. The two candidate checkbox controls become template-driven `☒` / `☐` text symbols in the generated copy. Row heights can expand for arrangements and notes. A candidate row repeats for each learner; the application imposes no 20-learner cap. The learner ID fills the form's “Person Code / D.O.B” column; the app collects an ID rather than an additional date of birth.

The form's fields are in `src/config/fields.ts`, and access-arrangement labels are in `src/config/accessArrangements.ts`. Start/end times are optional confirmed values. If no time is supplied, the document explicitly says it is unspecified and retains the timetable session. Signature and exams-office fields are left for completion after download. No signature or approval is inferred.

### Editing placeholders

Open the active template in Word, edit labels/formatting as required, and keep placeholder text intact. There is no Word formatting in React components. `src/services/templateData.ts` builds the clean data object; `src/services/generateBookingDocument.ts` fetches the static template and renders it locally with Docxtemplater and PizZip.

Supported placeholders include:

| Placeholder                                                      | Content                                                                             |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `{examinationName}`                                              | Subject, title, unit, code, qualification, series, session, duration and event type |
| `{exam.subject}`, `{exam.title}`, `{exam.code}`                  | Individual exam fields                                                              |
| `{exam.date}`, `{exam.isoDate}`                                  | Formatted date / ISO date                                                           |
| `{exam.unit}`, `{exam.session}`, `{exam.duration}`               | Timetable fields                                                                    |
| `{exam.examSeries}`, `{exam.qualification}`, `{exam.eventLabel}` | Series, qualification and event label                                               |
| `{requestedBy}`, `{requestDate}`, `{programmeArea}`              | Requester details                                                                   |
| `{location}`, `{invigilator}`, `{awardingBody}`                  | Booking details                                                                     |
| `{startTime}`, `{endTime}`                                       | Confirmed times, or explicit unspecified wording                                    |
| `{writtenCheckbox}`, `{onlineCheckbox}`                          | Exam-type checkbox symbols                                                          |
| `{cohort}`, `{notes}`, `{bookingNotes}`                          | Cohort / notes / combined version used in the form                                  |
| `{learnerCount}`, `{arrangementCount}`                           | Booking totals                                                                      |

In the candidate table, start the repeating row with **`{#learners}`** in the first cell and end it with **`{/learners}`** in the last cell of that same row. Within it:

| Placeholder                                          | Content                                                |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `{index}`, `{name}`, `{candidateId}`                 | Learner order and identity                             |
| `{aaCheckbox}`, `{arrangementDetails}`               | AA tick, selected arrangement labels and learner notes |
| `{arrangementText}`, `{notes}`                       | Arrangements and notes separately                      |
| `{resitCheckbox}`, `{resitNumber}`, `{ready}`        | Resit and readiness fields                             |
| `{checkboxes.extraTime}`, `{checkboxes.reader}` etc. | Individual arrangement checkboxes keyed by config ID   |
| `{extraTime}`, `{otherArrangement}`                  | Conditional detail values                              |

Raw `arrangements` and `hasArrangements` are also available for custom loops/conditions. Dot paths are supported by the service's simple parser; arbitrary expressions are not. Use plain text placeholders, not raw XML tags, for learner input. Docxtemplater escapes XML characters.

Reference: [Docxtemplater placeholder and repeating-row documentation](https://docxtemplater.com/docs/tag-types/).

To regenerate the initial prepared template from the untouched original, use Python with `lxml`:

```sh
python scripts/prepare-template.py
```

This overwrites the **prepared** template, so do not run it over subsequent manual template customizations. It changes only `word/document.xml`; every other DOCX package part is verified unchanged. This is a developer maintenance step, not a deployment dependency.

Filename format: `Exam_Booking_31768H_2027-01-15.docx`. Slashes in examination codes are replaced with underscores; learner names are never included.

## GitHub Pages

`vite.config.ts` uses `base: './'` and the document service resolves its template through `import.meta.env.BASE_URL`, so assets work under both a repository subpath and a custom domain. No React Router or server routes are needed.

The included `.github/workflows/pages.yml` tests and builds the app, then deploys `dist/` through GitHub Pages on pushes to `main` or manual dispatch. In repository **Settings → Pages**, choose **GitHub Actions** as the source. If your default branch has another name, update the workflow trigger. Dependencies use the checked-in pnpm lockfile.

Alternatively, publish the contents of `dist/` with your existing Pages workflow. Always include the `templates/` folder. Never add generated bookings to the repository or the public website.

## Important files

- `src/views/BookingView.tsx`, `src/views/CalendarView.tsx` — the two workflows.
- `src/components/booking/`, `src/components/calendar/` — learner, selector, grid and event components.
- `scripts/exam-import.ts`, `scripts/import-exams.ts` — normalization and XLSX import.
- `src/data/exams.json` — shared static timetable.
- `src/config/` — editable booking/learner fields and arrangements.
- `src/lib/booking.ts` — session model and validation.
- `src/services/` — template mapping, rendering and download.
- `public/templates/exam-booking-template.docx` — the active Word template.
- `tests/core.test.ts` — date, importer, calendar, validation and actual-template checks.

## Verification

Vitest exercises both Excel date systems, blank rows, trimming, duplicate IDs, source record count/bounds, year boundaries, combined filters, booking validation, checkbox mapping and XML escaping in an actual 25-learner DOCX export. TypeScript and Vite validate the production build.

Visual Word pagination should be checked after template changes, particularly with long notes and larger cohorts. The source and output document must open cleanly in Word; structural tests alone do not verify pagination.

Current verification: all 88 records and all nine source columns independently match the workbook. The 12 tests, TypeScript check and production build pass. Browser checks covered calendar-to-booking selection, filters, busy-day expansion, learner ordering, conditional arrangements, clear confirmation, refresh clearing, desktop/mobile layouts, and loading the built site under `/exam-booker/`.

**Remaining verification limitation:** visual DOCX pagination has not been confirmed. The bundled LibreOffice renderer is unavailable in this environment and local Word automation did not complete its PDF conversion. The supplied College form is already integrated; there is no missing-template dependency. The in-app browser also does not expose a completed-download event, so browser verification confirms successful generation and the explicit download link rather than a file saved to the user's Downloads folder.

## Pearson timetable preparation (provisional)

Run `pnpm prepare:pearson` to download the Winter and Summer 2027 final BTEC timetables and create `review/pearson-2027/review.xlsx`. For offline copies: `pnpm prepare:pearson path/to/winter.xlsx path/to/summer.xlsx` (winter first).

`config/pearson-selection.json` holds qualification/code pairs inferred from the staff-curated timetable. The Exams Team should confirm this list, including Welsh variants and newly offered courses. The script selects from **All papers** only, keeps parts, language, release dates, windows, deadlines and notes, and flags new/changed rows and repeats. Other papers and unmatched college codes have separate sheets. Dates outside August 2026–July 2027 are flagged, not silently removed.

The generated workbook is a local review artifact and does not change the website. After review, copy the approved first nine columns into a separate workbook's `Sheet3`, then run `pnpm import:exams path/to/approved.xlsx`, test, build and publish. Resolve windows using Pearson's full notes; the calendar currently displays event dates rather than continuous windows. Future academic years require updating the source URLs and selection dates in the script/config.

Verified against both Pearson 2027 files: 88 selected source rows, no unmatched college codes. The current published 88-event dataset remains unchanged pending confirmation. All 20 regression tests and the production build pass.
