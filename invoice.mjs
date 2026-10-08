// Invoices for finished jobs on the Lead Board. Totals and the PDF layout live
// here so they can be checked without a browser; crm.html does the saving.

// What prints at the top of every invoice. Change these to update all new invoices.
export const BUSINESS = {
  name: "Ascension Wash N' Geaux LLC",
  location: 'Gonzales, Louisiana',
  phone: '(225) 954-1848',
  email: 'thomasdbiz26@gmail.com',
  web: 'ascensionwashngeaux.com',
};

// Finished invoices are emailed here, through the same FormSubmit inbox the website quote form uses.
export const INVOICE_EMAIL_ENDPOINT = 'https://formsubmit.co/ajax/' + BUSINESS.email;

const cents = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const usd = (n) => '$' + cents(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clean = (v) => String(v ?? '').trim();

// Drops blank rows, coerces numbers, and works out subtotal, tax and total.
export function computeInvoice({ items, taxRate = 0 }) {
  const rows = (items || [])
    .map((i) => ({ desc: clean(i.desc), qty: Number(i.qty) || 0, price: cents(i.price) }))
    .filter((i) => i.desc && i.qty > 0);
  const subtotal = cents(rows.reduce((s, i) => s + i.qty * i.price, 0));
  const rate = Math.min(25, Math.max(0, Number(taxRate) || 0));
  const tax = cents((subtotal * rate) / 100);
  return { items: rows, taxRate: rate, subtotal, tax, total: cents(subtotal + tax) };
}

export function validateInvoice(inv) {
  if (!inv.items.length) return 'Add at least one line with a description and a quantity.';
  if (inv.items.some((i) => i.price < 0)) return 'Prices can’t be negative.';
  return '';
}

// The first line item suggested when a job is marked done: the service at the estimate.
export function draftItems(lead) {
  return [{ desc: clean(lead.service) || 'Cleaning service', qty: 1, price: Number(lead.estimate) || 0 }];
}

export const invoiceFileName = (inv) => `Invoice-${inv.number}-${clean(inv.bill_name).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'customer'}.pdf`;

const longDate = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '');

// Draws the invoice on a jsPDF document (US letter, points).
export function drawInvoice(doc, inv, business = BUSINESS) {
  const W = 612, L = 54, R = W - 54;
  const navy = [11, 46, 107], muted = [89, 105, 129], line = [216, 229, 243];
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...navy);
  doc.text(business.name, L, 72);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...muted);
  doc.text([business.location, business.phone + '  ·  ' + business.email, business.web], L, 90);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(...navy);
  doc.text('INVOICE', R, 72, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...muted);
  const meta = ['Invoice #' + inv.number, 'Date: ' + longDate(inv.created_at)];
  if (inv.job_date) meta.push('Service date: ' + longDate(inv.job_date));
  doc.text(meta, R, 90, { align: 'right' });

  let y = 150;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...muted);
  doc.text('BILL TO', L, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(16, 34, 62);
  const bill = [inv.bill_name, inv.bill_address, inv.bill_phone, inv.bill_email].map(clean).filter(Boolean);
  doc.text(bill, L, y + 16);
  y += 16 + bill.length * 14 + 24;

  const cQty = 380, cPrice = 460;
  doc.setFillColor(234, 243, 253); doc.rect(L, y - 14, R - L, 22, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...muted);
  doc.text('DESCRIPTION', L + 8, y); doc.text('QTY', cQty, y, { align: 'right' });
  doc.text('PRICE', cPrice, y, { align: 'right' }); doc.text('AMOUNT', R - 8, y, { align: 'right' });
  y += 24;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(16, 34, 62);
  for (const i of inv.items) {
    const lines = doc.splitTextToSize(i.desc, cQty - L - 60);
    if (y + lines.length * 14 > 680) { doc.addPage(); y = 72; }
    doc.text(lines, L + 8, y);
    doc.text(String(i.qty), cQty, y, { align: 'right' });
    doc.text(usd(i.price), cPrice, y, { align: 'right' });
    doc.text(usd(i.qty * i.price), R - 8, y, { align: 'right' });
    y += lines.length * 14 + 8;
    doc.setDrawColor(...line); doc.line(L, y - 10, R, y - 10);
  }

  y += 10;
  const sum = (label, value, bold) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(bold ? 13 : 11);
    doc.setTextColor(...(bold ? navy : muted)); doc.text(label, cPrice, y, { align: 'right' });
    doc.setTextColor(16, 34, 62); doc.text(value, R - 8, y, { align: 'right' }); y += bold ? 22 : 16;
  };
  sum('Subtotal', usd(inv.subtotal));
  if (Number(inv.tax_rate) > 0) sum('Tax (' + Number(inv.tax_rate) + '%)', usd(inv.tax));
  sum('Total due', usd(inv.total), true);

  if (clean(inv.notes)) {
    y += 14;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...muted); doc.text('NOTES', L, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(16, 34, 62);
    doc.text(doc.splitTextToSize(clean(inv.notes), R - L), L, y + 14);
  }

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...muted);
  doc.text('Thank you for your business!', W / 2, 740, { align: 'center' });
  return doc;
}

// The email to the business inbox: invoice details in the body, the PDF attached,
// and the customer's email as reply-to so it can be forwarded straight on.
export function buildInvoiceEmail(inv, pdfBlob) {
  const form = new FormData();
  form.append('_subject', `Invoice #${inv.number} for ${inv.bill_name}: ${usd(inv.total)}`);
  form.append('_template', 'table');
  form.append('_captcha', 'false');
  if (clean(inv.bill_email)) form.append('_replyto', clean(inv.bill_email));
  form.append('invoice', '#' + inv.number);
  form.append('customer', inv.bill_name);
  form.append('customer_phone', clean(inv.bill_phone) || 'not given');
  form.append('customer_email', clean(inv.bill_email) || 'not given');
  form.append('address', clean(inv.bill_address) || 'not given');
  form.append('line_items', inv.items.map((i) => `${i.desc}: ${i.qty} × ${usd(i.price)} = ${usd(i.qty * i.price)}`).join('\n'));
  if (Number(inv.tax_rate) > 0) form.append('tax', `${Number(inv.tax_rate)}%: ${usd(inv.tax)}`);
  form.append('total_due', usd(inv.total));
  if (clean(inv.notes)) form.append('notes', clean(inv.notes));
  form.append('next_step', 'The PDF invoice is attached. Forward this email or the PDF to the customer when you are ready to bill them. You can also download it again from the lead on the Lead Board.');
  if (pdfBlob) form.append('attachment', pdfBlob, invoiceFileName(inv));
  return form;
}

export async function emailInvoice(inv, pdfBlob, fetchImpl = fetch) {
  const res = await fetchImpl(INVOICE_EMAIL_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: buildInvoiceEmail(inv, pdfBlob) });
  if (!res.ok) throw new Error('Invoice email failed: ' + res.status);
  const data = await res.json().catch(() => ({}));
  if (data.success === false || data.success === 'false') throw new Error(data.message || 'Invoice email failed');
}
