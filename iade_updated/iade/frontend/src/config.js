const envApiUrl = (process.env.REACT_APP_API_URL || '').trim();
const fallbackApiUrl = `${window.location.protocol}//${window.location.hostname}:8091`;

const API_URL = (envApiUrl || fallbackApiUrl).replace(/\/$/, '');
export default API_URL;
