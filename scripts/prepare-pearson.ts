import ExcelJS from 'exceljs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { headers, clean, excelDate } from './exam-import';
import type { Exam } from '../src/types';

// Review only: never writes the published timetable.
const current: Exam[] = JSON.parse(await readFile('src/data/exams.json', 'utf8'));
const selection: { start: string; end: string; papers: { qualification: string; code: string }[] } =
  JSON.parse(await readFile('config/pearson-selection.json', 'utf8'));
const output = 'review/pearson-2027';
await mkdir(output, { recursive: true });
const workbook = new ExcelJS.Workbook();
const review = workbook.addWorksheet('Selected papers');
const metadata = [
  'Source',
  'Source row',
  'Part',
  'Language',
  'Release Date',
  'Window start',
  'Window end',
  'Submission deadline',
  'Notes',
  'Review',
];
review.addRow([...headers, ...metadata]);
const excluded = workbook.addWorksheet('Other papers');
excluded.addRow(['Source', 'Qualification', 'Code', 'Subject', 'Title']);
const seen = new Set<string>();
const found = new Set<string>();
let selected = 0;
const sources: string[] = [];
for (const [index, season] of ['winter', 'summer'].entries()) {
  const url = `https://qualifications.pearson.com/content/dam/pdf/Support/Examination-timetables/btec-${season}-2027-final-timetable.xlsx`;
  sources.push(url);
  const source = new ExcelJS.Workbook();
  const local = process.argv[index + 2];
  if (local) await source.xlsx.readFile(local);
  else {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`);
    const downloaded = `${output}/${season}-source.xlsx`;
    await writeFile(downloaded, Buffer.from(await response.arrayBuffer()));
    await source.xlsx.readFile(downloaded);
  }
  const sheet = source.getWorksheet('All papers');
  if (!sheet) throw new Error(`${season}: missing All papers sheet`);
  const names = (sheet.getRow(1).values as unknown[]).map(clean);
  for (const name of [...headers, 'Part', 'Language', 'Window start', 'Window end'])
    if (!names.includes(name)) throw new Error(`${season}: missing column ${name}`);
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const value = (name: string) => {
      const cell = row.getCell(names.indexOf(name));
      const v = cell.value;
      if (v && typeof v === 'object' && !(v instanceof Date)) {
        if ('result' in v) return v.result;
        if ('richText' in v) return v.richText.map((t) => t.text).join('');
      }
      return v;
    };
    const qualification = clean(value('Qual'));
    const code = clean(value('Examination code'));
    if (!code) return;
    const key = `${qualification}|${code}`;
    if (!selection.papers.some((p) => p.qualification === qualification && p.code === code)) {
      excluded.addRow([
        season,
        qualification,
        code,
        clean(value('Subject')),
        clean(value('Title')),
      ]);
      return;
    }
    found.add(key);
    const date = excelDate(value('Date'), source.properties.date1904);
    const notes: string[] = [];
    if (date < selection.start || date > selection.end)
      notes.push('Outside academic year — review');
    if (clean(value('Time')) === 'Window') notes.push('Check window, release and deadline details');
    const values = headers.map((h) => (h === 'Date' ? date : clean(value(h))));
    if (values.some((v) => !v)) notes.push('Missing field — requires review');
    const details = metadata.slice(2, -1).map((h) => {
      const v = value(h);
      return v instanceof Date ? excelDate(v) : clean(v);
    });
    // Flag repeats rather than discarding parts or language variants.
    const fingerprint = JSON.stringify([...values, ...details]);
    if (seen.has(fingerprint)) notes.push('Repeated across sources — review before importing');
    seen.add(fingerprint);
    const match = current.some(
      (e) =>
        e.qualification === qualification &&
        e.examinationCode === code &&
        e.date === date &&
        e.title === clean(value('Title')) &&
        e.duration === clean(value('Duration')) &&
        e.examSeries === clean(value('Exam series')) &&
        e.session === clean(value('Time')) &&
        e.unit === clean(value('Unit')) &&
        e.subject === clean(value('Subject')),
    );
    notes.unshift(match ? 'Matches a current event' : 'New or changed event — review');
    review.addRow([...values, season, rowNumber, ...details, notes.join('; ')]);
    selected++;
  });
}
const missing = selection.papers.filter((p) => !found.has(`${p.qualification}|${p.code}`));
const missingSheet = workbook.addWorksheet('Unmatched college codes');
missingSheet.addRow(['Qualification', 'Code']);
missing.forEach((p) => missingSheet.addRow([p.qualification, p.code]));
for (const sheet of workbook.worksheets) {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: sheet.rowCount, column: sheet.columnCount },
  };
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => {
    column.width = 24;
  });
}
await workbook.xlsx.writeFile(`${output}/review.xlsx`);
await writeFile(
  `${output}/README.txt`,
  `PROVISIONAL REVIEW — not published\nGenerated: ${new Date().toISOString()}\n${selected} selected source rows; ${missing.length} unmatched college codes.\nSelection inferred from the existing college timetable: confirm with Exams Team.\nBoth source files are read only from All papers. Parts, languages and repeated rows are preserved.\nCheck every New or changed event, all windows and all repeats. Other papers lists excluded entries to help identify newly offered courses.\nNo current events are deleted and no live data is changed.\nAfter review, copy the approved first nine columns into Sheet3 of a separate college workbook and use import:exams with that file.\nSources:\n${sources.join('\n')}\n`,
);
console.log(
  `Prepared ${output}/review.xlsx: ${selected} selected rows, ${missing.length} unmatched codes. Live timetable unchanged.`,
);
