import assert from 'node:assert/strict';
import {
  buildEstimatePayload,
  buildLeadPayload,
  uploadLeadPhotos,
  submitEstimateRequest,
  validateEstimate,
} from '../estimate-form.mjs';

const validEstimate = {
  name: 'Taylor Smith',
  phone: '(225) 555-0144',
  email: 'taylor@example.com',
  address: '123 Main St, Gonzales',
  service: 'House / siding washing',
  message: 'North side has mildew.',
  _honey: '',
};

assert.deepEqual(validateEstimate(validEstimate), {}, 'a complete estimate should be accepted');
assert.deepEqual(
  validateEstimate({ ...validEstimate, name: '', phone: '', service: '' }),
  {
    name: 'Please enter your name.',
    phone: 'Please enter a phone number.',
    service: 'Please choose a service.',
  },
  'missing required estimate details should return field-specific errors',
);

assert.deepEqual(
  buildEstimatePayload(validEstimate),
  {
    _subject: "New Ascension Wash N' Geaux estimate request",
    _template: 'table',
    _replyto: 'taylor@example.com',
    name: 'Taylor Smith',
    phone: '(225) 555-0144',
    email: 'taylor@example.com',
    address: '123 Main St, Gonzales',
    service: 'House / siding washing',
    message: 'North side has mildew.',
    _honey: '',
  },
  'the email payload should contain the customer details and a useful subject',
);

const requests = [];
const result = await submitEstimateRequest(validEstimate, async (url, options) => {
  requests.push({ url, options });
  return { ok: true, json: async () => ({ success: 'true' }) };
});

assert.equal(result.ok, true, 'successful delivery should be reported to the form');
assert.equal(requests.length, 2, 'the request should go to email and to the lead board');
const emailRequest = requests.find((r) => r.url.startsWith('https://formsubmit.co/'));
assert.equal(emailRequest.url, 'https://formsubmit.co/ajax/thomasdbiz26@gmail.com');
assert.equal(emailRequest.options.method, 'POST');
assert.equal(emailRequest.options.headers.Accept, 'application/json');
assert.deepEqual(JSON.parse(emailRequest.options.body), buildEstimatePayload(validEstimate));

const leadRequest = requests.find((r) => r.url.endsWith('/rest/v1/rpc/submit_estimate'));
assert.ok(leadRequest, 'the lead should be saved to the CRM');
assert.match(leadRequest.options.headers.apikey, /^sb_publishable_/, 'only the publishable key may ship in the site');
assert.deepEqual(JSON.parse(leadRequest.options.body), buildLeadPayload(validEstimate));

assert.equal(
  (await submitEstimateRequest(validEstimate, async (url) => (
    url.startsWith('https://formsubmit.co/') ? { ok: false, status: 500 } : { ok: true }
  ))).ok,
  true,
  'a saved lead should count as success even if the email service is down',
);

assert.equal(
  (await submitEstimateRequest(validEstimate, async (url) => (
    url.startsWith('https://formsubmit.co/') ? { ok: true, json: async () => ({ success: 'true' }) } : { ok: false, status: 503 }
  ))).ok,
  true,
  'a sent email should count as success even if the lead board is down',
);

await assert.rejects(
  () => submitEstimateRequest(validEstimate, async () => ({ ok: false, status: 500 })),
  /could not be sent/i,
  'a failed delivery should surface a retryable error',
);

let honeyCalls = 0;
await submitEstimateRequest({ ...validEstimate, _honey: 'bot' }, async () => { honeyCalls += 1; return { ok: true }; });
assert.equal(honeyCalls, 0, 'spam caught by the honeypot should not be sent anywhere');

// Photos: filed under the new lead's id, capped at 5, and never block the request.
const leadId = '6c71c96e-8770-4748-8c14-c656052a606e';
const fakePhoto = (type = 'image/jpeg') => ({ type, size: 1000 });
const photoCalls = [];
const withPhotos = await submitEstimateRequest(validEstimate, async (url, options) => {
  photoCalls.push({ url, options });
  if (url.startsWith('https://formsubmit.co/')) return { ok: true, json: async () => ({ success: 'true' }) };
  if (url.endsWith('/rpc/submit_estimate')) return { ok: true, json: async () => leadId };
  return { ok: true };
}, [fakePhoto(), fakePhoto('image/png'), fakePhoto(), fakePhoto(), fakePhoto(), fakePhoto()], async (p) => p);
const uploads = photoCalls.filter((c) => c.url.includes('/storage/v1/object/lead-photos/'));
assert.equal(uploads.length, 5, 'at most 5 photos should upload');
assert.match(uploads[0].url, new RegExp(`/lead-photos/${leadId}/0\\.jpg$`), 'photos go in a folder named after the lead');
assert.match(uploads[1].url, /\/1\.png$/, 'the file extension should follow the photo type');
assert.equal(uploads[0].options.headers['x-upsert'], 'false', 'uploads must never overwrite');
assert.equal(withPhotos.photosSaved, 5);
const emailWithPhotos = JSON.parse(photoCalls.find((c) => c.url.startsWith('https://formsubmit.co/')).options.body);
assert.equal(emailWithPhotos.photos, '5 photos on the lead board', 'the email should say photos are on the board');

const noLeadIdCalls = [];
const noLead = await submitEstimateRequest(validEstimate, async (url) => {
  noLeadIdCalls.push(url);
  return url.startsWith('https://formsubmit.co/') ? { ok: true, json: async () => ({ success: 'true' }) } : { ok: false, status: 503 };
}, [fakePhoto()], async (p) => p);
assert.equal(noLead.ok, true, 'the request still succeeds by email when the board is down');
assert.equal(noLeadIdCalls.some((u) => u.includes('/storage/')), false, 'no photo upload is tried without a lead id');

assert.equal(
  await uploadLeadPhotos(leadId, [fakePhoto(), fakePhoto()], async (url) => (url.endsWith('/0.jpg') ? { ok: false, status: 400 } : { ok: true }), async (p) => p),
  1,
  'one failed photo should not stop the others',
);

console.log('Verified estimate validation, delivery payload, success, and failure behavior.');
