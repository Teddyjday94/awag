export const validateSiteOrigin = (value) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('siteUrl must be an HTTPS origin without a path, query, fragment, or trailing slash.');
  }

  if (url.protocol !== 'https:' || url.origin !== value || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('siteUrl must be an HTTPS origin without a path, query, fragment, or trailing slash.');
  }

  return value;
};
