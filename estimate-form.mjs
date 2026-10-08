import { CRM_URL, CRM_KEY } from './crm-config.mjs';

const ESTIMATE_ENDPOINT = 'https://formsubmit.co/ajax/thomasdbiz26@gmail.com';
const LEAD_ENDPOINT = `${CRM_URL}/rest/v1/rpc/submit_estimate`;
const PHOTO_ENDPOINT = `${CRM_URL}/storage/v1/object/lead-photos`;
const SEND_ERROR = 'Your estimate request could not be sent. Please try again or call us.';
export const MAX_PHOTOS = 5;

const clean = (value) => String(value ?? '').trim();

export function validateEstimate(fields) {
  const errors = {};
  if (!clean(fields.name)) errors.name = 'Please enter your name.';
  if (!clean(fields.phone)) errors.phone = 'Please enter a phone number.';
  if (!clean(fields.service)) errors.service = 'Please choose a service.';
  return errors;
}

export function buildEstimatePayload(fields, photoCount = 0) {
  const email = clean(fields.email);
  const payload = {
    _subject: "New Ascension Wash N' Geaux estimate request",
    _template: 'table',
    _replyto: email,
    name: clean(fields.name),
    phone: clean(fields.phone),
    email,
    address: clean(fields.address),
    service: clean(fields.service),
    message: clean(fields.message),
    _honey: clean(fields._honey),
  };
  if (photoCount > 0) payload.photos = `${photoCount} photo${photoCount === 1 ? '' : 's'} on the lead board`;
  return payload;
}

export function buildLeadPayload(fields) {
  return {
    p_name: clean(fields.name),
    p_phone: clean(fields.phone),
    p_email: clean(fields.email),
    p_address: clean(fields.address),
    p_service: clean(fields.service),
    p_message: clean(fields.message),
    p_honey: clean(fields._honey),
  };
}

async function sendEstimateEmail(fields, fetchImpl, photoCount) {
  const response = await fetchImpl(ESTIMATE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(buildEstimatePayload(fields, photoCount)),
  });

  if (!response.ok) throw new Error(SEND_ERROR);

  const data = await response.json();
  if (data.success === false || data.success === 'false') {
    throw new Error(data.message || SEND_ERROR);
  }
}

export async function saveLeadToCrm(fields, fetchImpl = fetch) {
  const response = await fetchImpl(LEAD_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: CRM_KEY,
    },
    body: JSON.stringify(buildLeadPayload(fields)),
  });
  if (!response.ok) throw new Error(SEND_ERROR);
  // The database answers with the new lead's id, which photos are filed under.
  const id = typeof response.json === 'function' ? await response.json().catch(() => null) : null;
  return typeof id === 'string' ? id : null;
}

// Shrinks a phone photo to at most 1600px on its long side as a JPEG, so uploads
// stay quick on cell data. Falls back to the original file if the browser can't.
export async function preparePhoto(file) {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    return blob || file;
  } catch {
    return file;
  }
}

const photoExtension = (blob) => ({ 'image/png': 'png', 'image/webp': 'webp' }[blob.type] || 'jpg');

export async function uploadLeadPhotos(leadId, photos, fetchImpl = fetch, prepare = preparePhoto) {
  let saved = 0;
  for (const [index, photo] of [...photos].slice(0, MAX_PHOTOS).entries()) {
    try {
      const blob = await prepare(photo);
      const response = await fetchImpl(`${PHOTO_ENDPOINT}/${leadId}/${index}.${photoExtension(blob)}`, {
        method: 'POST',
        headers: {
          apikey: CRM_KEY,
          Authorization: `Bearer ${CRM_KEY}`,
          'Content-Type': blob.type || 'image/jpeg',
          'x-upsert': 'false',
        },
        body: blob,
      });
      if (response.ok) saved += 1;
    } catch {
      // One bad photo shouldn't stop the rest.
    }
  }
  return saved;
}

// The email and the lead board are sent side by side. The request only fails
// when neither one went through, so one outage never loses a customer.
export async function submitEstimateRequest(fields, fetchImpl = fetch, photos = [], prepare = preparePhoto) {
  if (clean(fields._honey)) return { ok: true, photosSaved: 0 };
  const photoList = [...photos].slice(0, MAX_PHOTOS);

  const errors = validateEstimate(fields);
  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors)[0]);
  }

  const [email, lead] = await Promise.allSettled([
    sendEstimateEmail(fields, fetchImpl, photoList.length),
    saveLeadToCrm(fields, fetchImpl),
  ]);

  if (email.status === 'rejected' && lead.status === 'rejected') {
    throw email.reason instanceof Error ? email.reason : new Error(SEND_ERROR);
  }

  const leadId = lead.status === 'fulfilled' ? lead.value : null;
  const photosSaved = leadId && photoList.length ? await uploadLeadPhotos(leadId, photoList, fetchImpl, prepare) : 0;
  return { ok: true, photosSaved, photosTried: photoList.length };
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
    const photoInput = form.querySelector('#quote-photos');
    const photos = photoInput ? [...photoInput.files] : [];
    const originalButton = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    submitButton.textContent = 'Sending request...';
    setStatus(status, photos.length ? 'Sending your request and photos...' : 'Sending your estimate request...', 'sending');

    try {
      const result = await submitEstimateRequest(fields, fetch, photos);
      form.reset();
      const photoNote = result.photosTried && result.photosSaved < result.photosTried
        ? ` ${result.photosTried - result.photosSaved} photo${result.photosTried - result.photosSaved === 1 ? '' : 's'} didn't upload, so feel free to text them to (225) 954-1848.`
        : '';
      setStatus(status, `Request sent. We'll contact you with the next step.${photoNote}`, 'success');
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
