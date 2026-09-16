"""Prepare the supplied College form for Docxtemplater; never change the source.

Only word/document.xml is changed. Existing geometry, styles, footer and package
relationships are retained. Run with Python and lxml (the Codex bundled Python
already includes lxml). Normal application use does not require Python.
"""
from copy import deepcopy
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from hashlib import sha256
from lxml import etree

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'src/Exam Request Form 2025.docx'
OUTPUT = ROOT / 'public/templates/exam-booking-template.docx'
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS = {'w': W}
q = lambda name: '{' + W + '}' + name

with ZipFile(SOURCE) as archive:
    original = {name: archive.read(name) for name in archive.namelist()}
root = etree.fromstring(original['word/document.xml'])
tables = root.xpath('//w:tbl', namespaces=NS)

def children(node, path):
    return node.xpath(path, namespaces=NS)

def fill_cell(cell, value):
    """Keep the source cell/paragraph/run formatting, replacing its text slot."""
    paragraphs = children(cell, './w:p')
    paragraph = paragraphs[0] if paragraphs else etree.SubElement(cell, q('p'))
    run_props = children(paragraph, './w:r/w:rPr') or children(paragraph, './w:pPr/w:rPr')
    props = deepcopy(run_props[0]) if run_props else None
    for p in paragraphs[1:]:
        cell.remove(p)
    for child in list(paragraph):
        if child.tag != q('pPr'):
            paragraph.remove(child)
    run = etree.SubElement(paragraph, q('r'))
    if props is not None:
        run.append(props)
    text = etree.SubElement(run, q('t'))
    text.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    text.text = value

rows = children(tables[0], './w:tr')
fill_cell(children(rows[0], './w:tc')[1], '{examinationName}')
fill_cell(children(rows[1], './w:tc')[1], '{exam.date}')
fill_cell(children(rows[2], './w:tc')[1], '{startTime}')
fill_cell(children(rows[2], './w:tc')[3], '{endTime}')
fill_cell(children(rows[3], './w:tc')[1], 'Written {writtenCheckbox}')
fill_cell(children(rows[3], './w:tc')[2], 'Online {onlineCheckbox}')
fill_cell(children(rows[4], './w:tc')[1], '{location}')
fill_cell(children(rows[4], './w:tc')[3], '{awardingBody}')
fill_cell(children(rows[5], './w:tc')[1], '{invigilator}')

# The candidate table contains two checkbox content controls per source row.
# In this application template those become template-driven static Word symbols,
# as specified in the brief. The original form retains its editable controls.
candidate_table = tables[1]
candidate_rows = children(candidate_table, './w:tr')
row = candidate_rows[1]
for control in children(row, './w:sdt'):
    content = children(control, './w:sdtContent')[0]
    position = row.index(control)
    for child in list(content):
        row.insert(position, child)
        position += 1
    row.remove(control)
cells = children(row, './w:tc')
assert len(cells) == 7, 'Expected seven candidate row slots.'
for cell, value in zip(cells, ['{#learners}{index}. {name}', '{candidateId}', '{aaCheckbox}', '{arrangementDetails}', '{resitCheckbox}', '{resitNumber}', '{ready}{/learners}']):
    fill_cell(cell, value)
for extra in candidate_rows[2:]:
    candidate_table.remove(extra)
# Repeating header, natural row height, and splittable outer candidate section
# keep long arrangements and large cohorts from clipping or being lost.
header_props = children(candidate_rows[0], './w:trPr')[0]
etree.SubElement(header_props, q('tblHeader'))
for height in children(root, '//w:trHeight'):
    height.set(q('hRule'), 'atLeast')
for keep in children(root, '//w:cantSplit'):
    keep.getparent().remove(keep)

fill_cell(children(tables[2], './w:tr/w:tc')[1], '{bookingNotes}')
request_rows = children(tables[3], './w:tr')
fill_cell(children(request_rows[0], './w:tc')[1], 'Name: {requestedBy}')
fill_cell(children(request_rows[0], './w:tc')[2], 'Date: {requestDate}')
fill_cell(children(request_rows[1], './w:tc')[2], 'Programme Area: {programmeArea}')

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(OUTPUT, 'w', ZIP_DEFLATED) as archive:
    for name, content in original.items():
        archive.writestr(name, etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True) if name == 'word/document.xml' else content)
with ZipFile(OUTPUT) as archive:
    assert all(archive.read(name) == content for name, content in original.items() if name != 'word/document.xml')
print(f'Prepared {OUTPUT}; original SHA-256: {sha256(SOURCE.read_bytes()).hexdigest()}')
