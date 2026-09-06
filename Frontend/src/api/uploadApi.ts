import { fetchWithAuth } from './authApi';
import { BASE_URL } from './config';

export const uploadApi = {
  /**
   * Upload an image file to the backend
   * @param file The File object from an input or drop event
   * @param isAdminMode When true, authenticates as the logged-in Master
   * Admin (aimsl_admin_token) instead of the regular user (aimsl_token).
   * The backend's /upload endpoint accepts either, but a Master Admin
   * usually isn't ALSO logged in as a regular user in the same browser --
   * without this, admin-mode uploads (Admin > Properties > Add/Edit) would
   * send no/invalid user auth and silently fail.
   * @returns The URL path of the saved file
   */
  async uploadImage(file: File, isAdminMode: boolean = false): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    let res: Response;
    if (isAdminMode) {
      const adminToken = localStorage.getItem('aimsl_admin_token');
      res = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        // DO NOT set Content-Type header here;
        // fetch will automatically set it with the correct multipart boundary
        body: formData,
      });
    } else {
      res = await fetchWithAuth(`${BASE_URL}/upload`, {
        method: 'POST',
        // DO NOT set Content-Type header here;
        // fetch will automatically set it with the correct multipart boundary
        body: formData,
      });
    }

    if (!res.ok) {
      let errorMessage = 'Image upload failed';
      try {
        const err = await res.json();
        errorMessage = err.detail || err.message || errorMessage;
      } catch (e) {
        // Ignore JSON parse error if response isn't JSON
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    return data.url;
  }
};