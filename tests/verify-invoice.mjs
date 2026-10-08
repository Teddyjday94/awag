import assert from 'node:assert/strict';
import {
  BUSINESS,
  INVOICE_EMAIL_ENDPOINT,
  buildInvoiceEmail,
  computeInvoice,
  draftItems,
  drawInvoice,
  emailInvoice,
  invoiceFileName,
  usd,
  validateInvoice,
} from '../invoice.mjs';

const totals = computeInvoice({
  items: [
    { desc: 'Roof soft washing', qty: 1, price: '450' },
    { desc: 'Gutter brightening', qty: '2', price: 37.5 },
    { desc: '', qty: 1, price: 99 },
    { desc: 'Skipped line', qty: 0, price: 10 },
  ],
  taxRate: '9.45',
});
assert.equal(totals.items.length, 2, 'blank and zero-quantity lines are dropped');
assert.equal(totals.subtotal, 525);
assert.equal(totals.tax, 49.61, 'tax rounds to the cent');
assert.equal(totals.total, 574.61);
assert.equal(computeInvoice({ items: [{ desc: 'Wash', qty: 1, price: 100 }], taxRate: 80 }).taxRate, 25, 'tax rate is capped');
assert.equal(usd(1234.5), '$1,234.50');

assert.match(validateInvoice(computeInvoice({ items: [{ desc: '', qty: 1, price: 5 }] })), /at least one line/);
assert.equal(validateInvoice(totals), '');

assert.deepEqual(draftItems({ service: 'Driveway or sidewalk', estimate: 225 }), [{ desc: 'Driveway or sidewalk', qty: 1, price: 225 }]);
assert.deepEqual(draftItems({ service: 'Fence or deck', estimate: null }), [{ desc: 'Fence or deck', qty: 1, price: 0 }]);

const invoice = {
  id: 'inv-1', number: 1001, lead_id: 'lead-1', created_at: '2026-10-08T16:00:00Z', job_date: '2026-10-07',
  bill_name: "Taylor O'Neil", bill_phone: '(225) 555-0144', bill_email: 'taylor@example.com', bill_address: '123 Main St, Gonzales',
  items: totals.items, tax_rate: totals.taxRate, subtotal: totals.subtotal, tax: totals.tax, total: totals.total, notes: 'Due on receipt.',
};
assert.equal(invoiceFileName(invoice), 'Invoice-1001-Taylor-O-Neil.pdf');

// The PDF layout only needs these jsPDF calls; record what gets written.
const written = [];
const doc = new Proxy({}, {
  get: (_, key) => (key === 'text' ? (t) => written.push(...[].concat(t)) : key === 'splitTextToSize' ? (t) => [t] : () => {}),
});
drawInvoice(doc, invoice);
for (const expected of [BUSINESS.name, BUSINESS.phone + '  ·  ' + BUSINESS.email, 'INVOICE', 'Invoice #1001', "Taylor O'Neil", '123 Main St, Gonzales', 'Roof soft washing', '$37.50', '$75.00', 'Tax (9.45%)', '$49.61', 'Total due', '$574.61', 'Due on receipt.']) {
  assert.ok(written.includes(expected), `the PDF should show ${expected}`);
}

const form = buildInvoiceEmail(invoice, new Blob(['%PDF'], { type: 'application/pdf' }));
assert.equal(form.get('_subject'), "Invoice #1001 for Taylor O'Neil: $574.61");
assert.equal(form.get('_replyto'), 'taylor@example.com', 'replying goes to the customer');
assert.equal(form.get('total_due'), '$574.61');
assert.match(form.get('line_items'), /Gutter brightening: 2 × \$37\.50 = \$75\.00/);
assert.equal(form.get('attachment').name, 'Invoice-1001-Taylor-O-Neil.pdf');
assert.equal(buildInvoiceEmail({ ...invoice, bill_email: null, tax_rate: 0, notes: '' }).get('_replyto'), null);

const sent = [];
await emailInvoice(invoice, null, async (url, opts) => { sent.push({ url, opts }); return { ok: true, json: async () => ({ success: 'true' }) }; });
assert.equal(sent[0].url, INVOICE_EMAIL_ENDPOINT);
assert.equal(INVOICE_EMAIL_ENDPOINT, 'https://formsubmit.co/ajax/thomasdbiz26@gmail.com', 'invoices go to the business inbox, not the customer');
await assert.rejects(emailInvoice(invoice, null, async () => ({ ok: false, status: 500 })));
await assert.rejects(emailInvoice(invoice, null, async () => ({ ok: true, json: async () => ({ success: 'false', message: 'nope' }) })), /nope/);

console.log('Invoice checks passed');
