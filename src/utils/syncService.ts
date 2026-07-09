import type { InspectionData } from './db';

export interface SyncProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Converts a Blob file to a base64 DataURL string.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Uploads an inspection report and all its high-resolution photos to a Webhook URL.
 * Detects if the target is Google Apps Script to automatically switch to a CORS-safe
 * text/plain JSON payload with Base64 encoded images.
 */
export async function syncInspection(
  inspection: InspectionData,
  webhookUrl: string,
  onProgress: (progress: SyncProgress) => void
): Promise<void> {
  
  // --- Google Apps Script Web App Integration (CORS Bypass) ---
  if (webhookUrl.includes('script.google.com')) {
    const photosWithBase64: { name: string; type: string; base64: string }[] = [];
    const totalPhotos = inspection.photos.length;

    // Convert all blobs to Base64 (updates progress from 0% to 30%)
    for (let i = 0; i < totalPhotos; i++) {
      const photo = inspection.photos[i];
      onProgress({
        loaded: i,
        total: totalPhotos,
        percentage: Math.round((i / totalPhotos) * 30)
      });
      const base64 = await blobToBase64(photo.original);
      photosWithBase64.push({
        name: photo.name,
        type: photo.type,
        base64
      });
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', webhookUrl);
      
      // Force text/plain to avoid browser CORS preflight (OPTIONS)
      xhr.setRequestHeader('Content-Type', 'text/plain');
      xhr.addEventListener('load', () => {
        // Google Web Apps redirect to googleusercontent on success (status 200 or 302/redirect followed)
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress({ loaded: 1, total: 1, percentage: 100 });
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.status === 'erro') {
              reject(new Error(`Erro no Script: ${response.message}`));
            } else {
              resolve();
            }
          } catch {
            // Sometimes Google Redirect responses can't be parsed as JSON directly, but status 200 means success
            resolve();
          }
        } else {
          reject(new Error(`Erro no Google Script: Status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Falha de conexão com o Google. Verifique o link de publicação do Web App.'));
      });

      const payload = {
        id: inspection.id,
        createdAt: inspection.createdAt,
        clientName: inspection.clientName,
        projectAddress: inspection.projectAddress,
        inspectorName: inspection.inspectorName,
        stage: inspection.customFields?.stage || 'Marcenaria',
        notes: inspection.notes,
        photos: photosWithBase64
      };

      xhr.send(JSON.stringify(payload));
    });
  }

  // --- Standard Webhook Flow (Multipart / Form-Data for Make, Zapier, etc.) ---
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', webhookUrl);
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Erro ao enviar: Status ${xhr.status} (${xhr.statusText || 'Erro no Servidor'})`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Erro de conexão ou URL inválida. Verifique seu sinal de rede.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Envio cancelado.'));
    });

    const formData = new FormData();
    formData.append('id', inspection.id);
    formData.append('createdAt', inspection.createdAt);
    formData.append('clientName', inspection.clientName);
    formData.append('projectAddress', inspection.projectAddress);
    formData.append('inspectorName', inspection.inspectorName);
    formData.append('notes', inspection.notes);

    if (inspection.customFields) {
      Object.entries(inspection.customFields).forEach(([key, val]) => {
        formData.append(key, val);
      });
    }

    inspection.photos.forEach((photo) => {
      formData.append('photos', photo.original, photo.name);
    });

    xhr.send(formData);
  });
}
