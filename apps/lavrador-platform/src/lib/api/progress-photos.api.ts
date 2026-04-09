import axios from 'axios';

const BASE = '/api/progress-photos';

export const progressPhotosApi = {
  upload(clientId: string, file: File, meta: { angle?: string; notes?: string; takenAt?: string }) {
    const form = new FormData();
    form.append('file', file);
    if (meta.angle) form.append('angle', meta.angle);
    if (meta.notes) form.append('notes', meta.notes);
    if (meta.takenAt) form.append('takenAt', meta.takenAt);
    return axios.post(`${BASE}/client/${clientId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  getByClient(clientId: string): Promise<ProgressPhoto[]> {
    return axios.get(`${BASE}/client/${clientId}`).then(r => r.data);
  },

  delete(id: string) {
    return axios.delete(`${BASE}/${id}`).then(r => r.data);
  },
};

export interface ProgressPhoto {
  id: string;
  clientId: string;
  url: string;
  angle?: string;
  notes?: string;
  takenAt: string;
  assessmentId?: string;
  createdAt: string;
}
