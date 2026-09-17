import { readFile, writeFile } from 'node:fs/promises';
import { matchWindow, pearsonOverview } from './pearson-windows';
import type { Exam } from '../src/types';

type SourceRow = { source_id: string; data: Record<string, unknown> };
let sources: { id: string; name: string }[];
let rows: SourceRow[];
if (process.argv[2]) {
  ({ sources, rows } = JSON.parse(await readFile(process.argv[2], 'utf8')));
} else {
  // Follow only the public, published dashboard interface used by Pearson's page.
  // No login, private dashboard lookup or write requests are used.
  const getText = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Pearson download failed (${response.status})`);
    return response.text();
  };
  const html = await getText(pearsonOverview);
  const asset = html.match(/<script[^>]+src="([^"]+)"/s)?.[1];
  if (!asset) throw new Error('Pearson page structure changed: missing app script');
  const script = await getText(new URL(asset, pearsonOverview).href);
  const base = script.match(/https:\/\/[a-z]+\.supabase\.co/)?.[0];
  const key = script.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0];
  if (
    !base ||
    !key ||
    JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role !== 'anon'
  )
    throw new Error('Pearson public interface changed; review the importer');
  const get = async (table: string, query: Record<string, string>) => {
    const response = await fetch(`${base}/rest/v1/${table}?${new URLSearchParams(query)}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) throw new Error(`Pearson public data failed (${response.status})`);
    return response.json();
  };
  const dashboards = await get('linked_dashboards', {
    select: 'id',
    slug: 'eq.btec-external-assessment-overview-8u07',
    is_published: 'eq.true',
  });
  if (dashboards.length !== 1) throw new Error('Published Pearson dashboard not found');
  const dashboard_id = `eq.${dashboards[0].id}`;
  sources = await get('linked_sources', {
    select: 'id,name',
    dashboard_id,
    order: 'created_at.asc',
  });
  rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page: SourceRow[] = await get('linked_rows', {
      select: 'source_id,data',
      dashboard_id,
      order: 'row_index.asc,id.asc',
      limit: '1000',
      offset: String(offset),
    });
    rows.push(...page);
    if (page.length < 1000) break;
  }
}
const sourceIds = sources
  .filter((s) => ['Winter 2027', 'Summer 2027'].includes(s.name))
  .map((s) => s.id);
if (sourceIds.length !== 2) throw new Error('Expected both Winter and Summer 2027 sources');
const timetable = rows.filter((row) => sourceIds.includes(row.source_id)).map((row) => row.data);
const exams: Exam[] = JSON.parse(await readFile('src/data/exams.json', 'utf8'));
const windows = Object.fromEntries(
  exams
    .filter((e) => e.session === 'Window')
    .map((exam) => [exam.id, matchWindow(exam, timetable)]),
);
// Match and validate everything before writing. Curated event IDs/dates remain unchanged.
await writeFile('src/data/exam-windows.json', JSON.stringify(windows, null, 2) + '\n');
console.log(
  `Matched ${Object.keys(windows).length} window events to the published Pearson overview. Review the data diff before publishing.`,
);
