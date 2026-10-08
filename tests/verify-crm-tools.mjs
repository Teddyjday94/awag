import assert from 'node:assert/strict';
import { leadsToCsv, monthGrid, reviewMessage, smsHref } from '../crm-tools.mjs';

const csv = leadsToCsv([
  { created_at: '2026-10-08T15:30:34Z', name: 'Ann "Annie" Hebert', phone: '(225) 555-0101', stage: 'quoted', estimate: 450, message: 'North side, then\nthe porch' },
  { created_at: '2026-10-09T10:00:00Z', name: '=HYPERLINK("http://bad")', phone: '+1 225 555 0102', stage: 'new' },
]);
const lines = csv.replace(/^﻿/, '').split('\r\n');
assert.ok(csv.startsWith('﻿'), 'CSV should start with a BOM so Excel reads it as UTF-8');
assert.match(lines[0], /^"Came in","Name","Phone"/, 'CSV should have readable headers');
assert.match(csv, /"Ann ""Annie"" Hebert"/, 'quotes inside a cell should be doubled');
assert.match(csv, /"Estimate sent"/, 'stages should use the board labels');
assert.match(csv, /"2026-10-08"/, 'dates should be plain days');
assert.match(csv, /"'=HYPERLINK/, 'cells that look like formulas should be neutralised');
assert.match(csv, /"'\+1 225 555 0102"/, 'a phone starting with + must not be read as a formula');
assert.match(csv, /"North side, then\nthe porch"/, 'line breaks stay inside their quoted cell');

const oct2026 = monthGrid(2026, 9);
assert.equal(oct2026[0][0].iso, '2026-09-27', 'October 2026 grid starts on the Sunday before the 1st');
assert.equal(oct2026[0][4].iso, '2026-10-01');
assert.ok(oct2026.every((w) => w.length === 7), 'every week has seven days');
assert.equal(oct2026.at(-1).at(-1).iso, '2026-10-31', 'Oct 31 2026 is a Saturday, so the grid ends on it');
assert.equal(monthGrid(2026, 10).at(-1).at(-1).iso, '2026-12-05', 'November 2026 finishes its last week in December');
assert.equal(oct2026.flat().filter((d) => d.inMonth).length, 31);
const feb2026 = monthGrid(2026, 1);
assert.equal(feb2026.length, 4, 'February 2026 starts on a Sunday and fits in four weeks');

const msg = reviewMessage('Lisa Melancon', 'https://ascensionwashngeaux.com/review.html');
assert.match(msg, /^Hi Lisa, thanks/, 'review text greets the customer by first name');
assert.match(msg, /review\.html$/, 'review text ends with the link');
assert.match(reviewMessage('Kevin Doucet · Cajun Corner Market', 'u'), /^Hi Kevin,/);
assert.match(reviewMessage('', 'u'), /^Hi, thanks/);

assert.equal(smsHref('(225) 555-0101', 'Hi & thanks'), 'sms:2255550101?&body=Hi%20%26%20thanks');

console.log('Verified lead export, calendar grid, and review request text.');
