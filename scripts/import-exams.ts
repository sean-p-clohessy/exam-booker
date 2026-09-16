import ExcelJS from 'exceljs';
import { mkdir, writeFile } from 'node:fs/promises';
import { parseRows } from './exam-import';

const source = process.argv[2] ?? 'src/BTEC EXAM Timetable for 26-27.xlsx';
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(source);
const sheet = workbook.getWorksheet('Sheet3');
if (!sheet)
  throw new Error(
    `Expected worksheet Sheet3 in ${source}. Found: ${workbook.worksheets.map((s) => s.name).join(', ')}`,
  );
const rows: unknown[][] = [];
sheet.eachRow({ includeEmpty: true }, (row) => {
  const values: unknown[] = [];
  row.eachCell((cell, column) => {
    let value = cell.value;
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('richText' in value) value = value.richText.map((run) => run.text).join('');
      else if ('result' in value) value = value.result ?? null;
      else if ('text' in value) value = value.text;
    }
    values[column - 1] = value;
  });
  rows.push(values);
});
const exams = parseRows(rows, workbook.properties.date1904);
if (!exams.length) throw new Error('The timetable contains no exam records.');
await mkdir('src/data', { recursive: true });
await writeFile('src/data/exams.json', JSON.stringify(exams, null, 2) + '\n');
console.log(`Imported ${exams.length} records: ${exams[0].date} to ${exams.at(-1)!.date}.`);
