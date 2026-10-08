import assert from 'node:assert/strict';
import {
  buildEstimatePayload,
  buildLeadPayload,
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

assert.deepEqual(result, { ok: true }, 'successful delivery should be reported to the form');
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

assert.deepEqual(
  await submitEstimateRequest(validEstimate, async (url) => (
    url.startsWith('https://formsubmit.co/') ? { ok: false, status: 500 } : { ok: true }
  )),
  { ok: true },
  'a saved lead should count as success even if the email service is down',
);

assert.deepEqual(
  await submitEstimateRequest(validEstimate, async (url) => (
    url.startsWith('https://formsubmit.co/') ? { ok: true, json: async () => ({ success: 'true' }) } : { ok: false, status: 503 }
  )),
  { ok: true },
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

console.log('Verified estimate validation, delivery payload, success, and failure behavior.');
