import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { Booking, Exam } from '../types';
import { bookingFilename, buildTemplateData } from './templateData';

export function renderBookingDocument(
  template: ArrayBuffer | Uint8Array,
  booking: Booking,
  exam: Exam,
) {
  const data = buildTemplateData(booking, exam);
  const document = new Docxtemplater(new PizZip(template), {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
    parser: (tag) => ({
      get: (scope) =>
        tag === '.' ? scope : tag.split('.').reduce((value, key) => value?.[key], scope),
    }),
  });
  document.render(data);
  return document.getZip().generate({ type: 'uint8array', compression: 'DEFLATE' });
}
export async function generateBookingDocument(booking: Booking, exam: Exam) {
  const response = await fetch(`${import.meta.env.BASE_URL}templates/exam-booking-template.docx`);
  if (!response.ok)
    throw new Error(
      'The Word template could not be loaded. Please check the site installation and try again.',
    );
  const bytes = renderBookingDocument(await response.arrayBuffer(), booking, exam);
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  const filename = bookingFilename(exam, booking.info.assessmentDate);
  link.download = filename;
  // Keep the download link in the active modal's interactive subtree.
  // Content outside a showModal() dialog is inert in the browser.
  const host = document.querySelector('dialog[open]') ?? document.body;
  host.appendChild(link);
  link.click();
  link.remove();
  return { url, filename };
}
