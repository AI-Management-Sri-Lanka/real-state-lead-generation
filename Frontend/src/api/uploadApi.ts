import { fetchWithAuth } from './authApi';
import { BASE_URL } from './config';

export const uploadApi = {
  /**
   * Upload an image file to the backend
   * @param file The File object from an input or drop event
   * @returns The URL path of the saved file
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetchWithAuth(`${BASE_URL}/upload`, {
      method: 'POST',
      // DO NOT set Content-Type header here; 
      // fetch will automatically set it with the correct multipart boundary
      body: formData,
    });

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
