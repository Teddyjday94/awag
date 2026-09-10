const ESTIMATE_ENDPOINT = 'https://formsubmit.co/ajax/thomasdbiz26@gmail.com';

const clean = (value) => String(value ?? '').trim();

export function validateEstimate(fields) {
  const errors = {};
  if (!clean(fields.name)) errors.name = 'Please enter your name.';
  if (!clean(fields.phone)) errors.phone = 'Please enter a phone number.';
  if (!clean(fields.service)) errors.service = 'Please choose a service.';
  return errors;
}

export function buildEstimatePayload(fields) {
  const email = clean(fields.email);
  return {
    _subject: "New Ascension Wash N' Geaux estimate request",
    _template: 'table',
    _replyto: email,
    name: clean(fields.name),
    phone: clean(fields.phone),
    email,
    address: clean(fields.address),
    service: clean(fields.service),
    message: clean(fields.message),
    website: clean(fields.website),
  };
}

export async function submitEstimateRequest(fields, fetchImpl = fetch) {
  if (clean(fields.website)) return { ok: true };

  const errors = validateEstimate(fields);
  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors)[0]);
  }

  const response = await fetchImpl(ESTIMATE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(buildEstimatePayload(fields)),
  });

  if (!response.ok) {
    throw new Error('Your estimate request could not be sent. Please try again or call us.');
  }

  const data = await response.json();
  if (data.success === false || data.success === 'false') {
    throw new Error(data.message || 'Your estimate request could not be sent. Please try again or call us.');
  }

  return { ok: true };
}

function setStatus(status, message, state = '') {
  status.textContent = message;
  status.className = `form-status${state ? ` is-${state}` : ''}`;
}

function initEstimateForm() {
  const form = document.querySelector('#quote-form');
  if (!form) return;

  const status = form.querySelector('#quote-form-status');
  const submitButton = form.querySelector('button[type="submit"]');
  if (!status || !submitButton) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const fields = Object.fromEntries(new FormData(form).entries());
    const originalButton = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    submitButton.textContent = 'Sending request...';
    setStatus(status, 'Sending your estimate request...', 'sending');

    try {
      await submitEstimateRequest(fields);
      form.reset();
      setStatus(status, "Request sent. We'll contact you with the next step.", 'success');
    } catch (error) {
      setStatus(status, error.message || 'Something went wrong. Please try again or call (225) 954-1848.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      submitButton.innerHTML = originalButton;
    }
  });
}

if (typeof document !== 'undefined') initEstimateForm();
