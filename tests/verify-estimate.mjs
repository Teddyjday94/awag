import assert from 'node:assert/strict';
import {
  buildEstimatePayload,
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

let request;
const result = await submitEstimateRequest(validEstimate, async (url, options) => {
  request = { url, options };
  return { ok: true, json: async () => ({ success: 'true' }) };
});

assert.deepEqual(result, { ok: true }, 'successful delivery should be reported to the form');
assert.equal(request.url, 'https://formsubmit.co/ajax/thomasdbiz26@gmail.com');
assert.equal(request.options.method, 'POST');
assert.equal(request.options.headers.Accept, 'application/json');
assert.deepEqual(JSON.parse(request.options.body), buildEstimatePayload(validEstimate));

await assert.rejects(
  () => submitEstimateRequest(validEstimate, async () => ({ ok: false, status: 500 })),
  /could not be sent/i,
  'a failed delivery should surface a retryable error',
);

console.log('Verified estimate validation, delivery payload, success, and failure behavior.');
