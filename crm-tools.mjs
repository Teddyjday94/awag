// Helpers for the Lead Board that don't touch the page, so they can be tested in Node.

const CSV_COLUMNS = [
  ['created_at', 'Came in'],
  ['name', 'Name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['address', 'Address'],
  ['service', 'Service'],
  ['source', 'Came from'],
  ['stage', 'Stage'],
  ['estimate', 'Estimate'],
  ['follow_up', 'Follow up on'],
  ['job_date', 'Job date'],
  ['lost_reason', 'Why it didn’t go'],
  ['message', 'Customer notes'],
];

const STAGE_LABELS = {
  new: 'New request', contacted: 'Talked to', quoted: 'Estimate sent',
  booked: 'Booked', done: 'Done & paid', lost: 'Didn’t go',
};

// Quote every cell, and stop a spreadsheet from running anything a customer typed
// that starts like a formula (=, +, -, @).
function csvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function leadsToCsv(leads) {
  const rows = [CSV_COLUMNS.map(([, label]) => csvCell(label)).join(',')];
  for (const lead of leads) {
    rows.push(CSV_COLUMNS.map(([key]) => {
      if (key === 'stage') return csvCell(STAGE_LABELS[lead.stage] || lead.stage);
      if (key === 'created_at') return csvCell(lead.created_at ? String(lead.created_at).slice(0, 10) : '');
      return csvCell(lead[key]);
    }).join(','));
  }
  return '﻿' + rows.join('\r\n') + '\r\n'; // BOM so Excel reads accents correctly
}

const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (year, monthIndex, day) => `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

// Weeks (Sunday first) covering the month, each day as { iso, day, inMonth }.
export function monthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const start = new Date(year, monthIndex, 1 - first.getDay());
  const last = new Date(year, monthIndex + 1, 0);
  const weeks = [];
  for (let d = new Date(start); d <= last || d.getDay() !== 0; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) weeks.push([]);
    weeks[weeks.length - 1].push({
      iso: isoDate(d.getFullYear(), d.getMonth(), d.getDate()),
      day: d.getDate(),
      inMonth: d.getMonth() === monthIndex,
    });
  }
  return weeks;
}

export function reviewMessage(name, reviewUrl) {
  const first = String(name || '').split(/[\s·]+/)[0];
  return `Hi${first ? ' ' + first : ''}, thanks for choosing Ascension Wash N' Geaux! `
    + `If you're happy with how it turned out, a quick review helps a small local business a lot: ${reviewUrl}`;
}

// "?&body=" works on both iPhone and Android messaging apps.
export function smsHref(phone, body) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return `sms:${digits}?&body=${encodeURIComponent(body)}`;
}
