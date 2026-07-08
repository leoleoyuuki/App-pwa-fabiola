import type { InspectionData } from './db';

export interface SyncProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Uploads an inspection report and all its high-resolution photos to a Webhook URL.
 * Uses XMLHttpRequest to track exact upload byte progress.
 */
export function syncInspection(
  inspection: InspectionData,
  webhookUrl: string,
  onProgress: (progress: SyncProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('POST', webhookUrl);
    
    // Set up progress tracking on upload stream
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

    // Append original high-resolution photos under the key 'photos'
    inspection.photos.forEach((photo) => {
      formData.append('photos', photo.original, photo.name);
    });

    xhr.send(formData);
  });
}
