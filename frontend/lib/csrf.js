/**
 * Reads the csrftoken cookie and returns its value.
 * Import this wherever POST, PATCH, or DELETE requests are made.
 */
export function getCSRFToken() {
  if (typeof document === 'undefined') return '';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') {
      return decodeURIComponent(value);
    }
  }
  return '';
}
