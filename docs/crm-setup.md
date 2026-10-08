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
