# Lead Board (crm.html)

Quote requests from the website are saved to a Supabase database (project
"Wash N Geaux CRM") and still emailed as before. The owner works them at
`crm.html`, which is not linked from the site and is hidden from search engines.

## One-time setup in the Supabase dashboard

Authentication → URL Configuration:

- Site URL: `https://ascensionwashngeaux.com/crm.html`
- Redirect URLs: add `https://ascensionwashngeaux.com/crm.html`

Without this, the emailed sign-in link sends people to localhost.

## Who can see leads

Staff sign in with their email and a password. The first time (or after
forgetting it), they tap "First time here, or forgot your password?", get an
emailed link, and choose a password when it opens. "Change password" on the
board changes it later.

Anyone can request that link, but only emails in the `staff` table see any
data. To add someone, run in the SQL editor:

```sql
insert into public.staff (email) values ('name@example.com');
```

To remove someone: `delete from public.staff where email = 'name@example.com';`

## How leads get in

- The website form calls `submit_estimate` (the only thing visitors can do).
  A repeat from the same phone number within 10 minutes is ignored, and the
  form's hidden spam field is checked.
- "+ New lead" on the board adds calls, texts, referrals, and so on.

## Invoices for finished jobs

Moving a lead to "Done & paid" opens an invoice form, filled in with the
service and the estimate. Add lines, sales tax and a note, then "Create & email
invoice". The invoice gets the next number (starting at 1001), is saved with the
lead, and a PDF is emailed to thomasdbiz26@gmail.com through FormSubmit, the
same service the quote form uses. Reply to that email (it replies to the
customer) or forward the PDF when you are ready to bill them. The lead's sheet
keeps every invoice with "Download PDF" and "Email again".

The business name, phone and email printed on invoices are in `BUSINESS` at the
top of `invoice.mjs`. The `invoices` table was added with this SQL:

```sql
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  number integer generated always as identity (start with 1001) unique,
  lead_id uuid not null references public.leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by text default (auth.jwt() ->> 'email'),
  bill_name text not null check (char_length(bill_name) between 1 and 200),
  bill_phone text check (char_length(bill_phone) <= 40),
  bill_email text check (char_length(bill_email) <= 200),
  bill_address text check (char_length(bill_address) <= 300),
  job_date date,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50),
  tax_rate numeric not null default 0 check (tax_rate >= 0 and tax_rate <= 25),
  subtotal numeric not null check (subtotal >= 0),
  tax numeric not null default 0 check (tax >= 0),
  total numeric not null check (total >= 0),
  notes text check (char_length(notes) <= 2000),
  emailed_at timestamptz
);
create index invoices_lead_id_idx on public.invoices (lead_id);
alter table public.invoices enable row level security;
create policy "staff manage invoices" on public.invoices for all to authenticated
  using (private.is_staff()) with check (private.is_staff());
grant select, insert, update, delete on public.invoices to authenticated;
alter publication supabase_realtime add table public.invoices;
```

## Customer photos

The quote form takes up to 5 photos. They are shrunk in the browser and stored
in the private Supabase bucket `lead-photos`, in a folder named after the lead.
Visitors can only add photos to a lead created in the last 30 minutes; only
staff can view or delete them. Deleting a lead on the board deletes its photos.

## Push alerts (ntfy)

- Every website lead sends a push to the ntfy topic stored in
  `private.settings` (key `ntfy_topic`). Subscribe to that topic in the ntfy app.
- A morning digest goes out at 12:45 UTC (7:45am Central in summer, 6:45am in
  winter) listing new requests, follow-ups due, estimates with no answer in
  3+ days, and today's jobs. Nothing is sent on a quiet day.
- To change the topic: `update private.settings set value = '<new topic>' where key = 'ntfy_topic';`

## Review requests

Jobs marked "Done & paid" show an "Ask for a review" box with a ready text
message. It links to `review.html`, which sends customers to Google and
Facebook. Once the Google Business Profile exists, replace the Google link in
`review.html` (`id="review-google"`) with the profile's "Ask for reviews" link.
