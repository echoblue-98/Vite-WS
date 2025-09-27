// Vite-only API URL accessor. Only import this in Vite (non-test) environments.
// @ts-ignore
export function getViteApiUrl() {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/';
}
