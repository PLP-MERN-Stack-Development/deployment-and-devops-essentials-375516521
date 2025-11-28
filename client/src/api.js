// client/src/api.js
import axios from 'axios';
const API_BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await axios.post(`${API_BASE}/api/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data; // { url }
}
