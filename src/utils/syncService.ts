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
 * Converts a Blob file to an optimized high-resolution JPEG Base64 string for Google Drive (max 1920px, ~450KB).
 * Preserves high forensic clarity while keeping the mobile network payload lightweight and reliable.
 */
export function compressImageForDrive(blob: Blob, maxWidth = 1920, maxHeight = 1920, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        blobToBase64(blob).then(resolve).catch(() => resolve(''));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      blobToBase64(blob).then(resolve).catch(() => resolve(''));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a Blob file to an optimized JPEG Base64 string for PDF printing (max 900px, ~70KB).
 */
export function resizeImageForPdf(blob: Blob, maxWidth = 900, maxHeight = 900): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      blobToBase64(blob).then(resolve).catch(() => resolve(''));
    };
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
    const photosImovelWithBase64: { name: string; type: string; base64: string; pdfBase64: string }[] = [];
    const photosMedidorWithBase64: { name: string; type: string; base64: string; pdfBase64: string }[] = [];
    const totalPhotos = inspection.photosImovel.length + inspection.photosMedidor.length;
    let convertedCount = 0;

    // Convert photosImovel
    for (let i = 0; i < inspection.photosImovel.length; i++) {
      const photo = inspection.photosImovel[i];
      onProgress({
        loaded: convertedCount,
        total: totalPhotos,
        percentage: Math.round((convertedCount / Math.max(1, totalPhotos)) * 30)
      });
      const base64 = await compressImageForDrive(photo.original);
      const pdfBase64 = await resizeImageForPdf(photo.original);
      photosImovelWithBase64.push({
        name: photo.name,
        type: photo.type,
        base64,
        pdfBase64
      });
      convertedCount++;
    }

    // Convert photosMedidor
    for (let i = 0; i < inspection.photosMedidor.length; i++) {
      const photo = inspection.photosMedidor[i];
      onProgress({
        loaded: convertedCount,
        total: totalPhotos,
        percentage: Math.round((convertedCount / Math.max(1, totalPhotos)) * 30)
      });
      const base64 = await compressImageForDrive(photo.original);
      const pdfBase64 = await resizeImageForPdf(photo.original);
      photosMedidorWithBase64.push({
        name: photo.name,
        type: photo.type,
        base64,
        pdfBase64
      });
      convertedCount++;
    }

    const payload = {
      id: inspection.id,
      createdAt: inspection.createdAt,
      peritoEmail: inspection.peritoEmail || '',
      nomeAutor: inspection.nomeAutor,
      numeroProcesso: inspection.numeroProcesso,
      reuConcessionaria: inspection.reuConcessionaria,
      tipoAcao: inspection.tipoAcao,
      dataVistoria: inspection.dataVistoria,
      numeroVistoria: inspection.numeroVistoria,
      periodoVistoria: inspection.periodoVistoria,
      representacaoAutor: inspection.representacaoAutor,
      representacaoReu: inspection.representacaoReu,
      observacoesPresenca: inspection.observacoesPresenca,
      numeroMedidor: inspection.numeroMedidor,
      medidorChip: inspection.medidorChip,
      condicoesMedidor: inspection.condicoesMedidor,
      corteEnergia: inspection.corteEnergia,
      observacoesMedidor: inspection.observacoesMedidor || '',
      qtdPessoas: inspection.qtdPessoas,
      qtdComodos: inspection.qtdComodos,
      numLampadas: inspection.numLampadas,
      numTvs: inspection.numTvs,
      numVentiladores: inspection.numVentiladores,
      numVentiladoresTeto: inspection.numVentiladoresTeto,
      numArCondicionados: inspection.numArCondicionados,
      numGeladeiras: inspection.numGeladeiras,
      numChuveiros: inspection.numChuveiros,
      numMaquinasLavar: inspection.numMaquinasLavar,
      numFreezers: inspection.numFreezers,
      checklist: inspection.checklist.join(', '),
      observacoesFinais: inspection.observacoesFinais,
      photosImovel: photosImovelWithBase64,
      photosMedidor: photosMedidorWithBase64
    };

    onProgress({ loaded: 1, total: 2, percentage: 60 });

    try {
      // First try standard fetch with text/plain
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onProgress({ loaded: 2, total: 2, percentage: 100 });
        try {
          const resData = await response.json();
          if (resData && resData.status === 'erro') {
            throw new Error(`Erro no Script: ${resData.message}`);
          }
        } catch (jsonErr: any) {
          if (jsonErr.message && jsonErr.message.startsWith('Erro no Script:')) {
            throw jsonErr;
          }
        }
        return;
      }
      throw new Error(`Status ${response.status}`);
    } catch (fetchErr: any) {
      if (fetchErr.message && fetchErr.message.startsWith('Erro no Script:')) {
        throw fetchErr;
      }
      
      // If standard fetch failed due to iOS / Safari CORS redirect restrictions (302 redirect to googleusercontent),
      // fallback to mode: 'no-cors' which bypasses Safari's redirect block reliably
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        onProgress({ loaded: 2, total: 2, percentage: 100 });
        return;
      } catch (noCorsErr: any) {
        throw new Error(fetchErr.message || 'Falha de conexão com o Google Apps Script.');
      }
    }
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
    formData.append('nomeAutor', inspection.nomeAutor);
    formData.append('numeroProcesso', inspection.numeroProcesso);
    formData.append('reuConcessionaria', inspection.reuConcessionaria);
    formData.append('tipoAcao', inspection.tipoAcao);
    formData.append('dataVistoria', inspection.dataVistoria);
    formData.append('numeroVistoria', inspection.numeroVistoria);
    formData.append('periodoVistoria', inspection.periodoVistoria);
    formData.append('representacaoAutor', inspection.representacaoAutor);
    formData.append('representacaoReu', inspection.representacaoReu);
    formData.append('observacoesPresenca', inspection.observacoesPresenca);
    formData.append('numeroMedidor', inspection.numeroMedidor);
    formData.append('medidorChip', inspection.medidorChip);
    formData.append('condicoesMedidor', inspection.condicoesMedidor);
    formData.append('corteEnergia', inspection.corteEnergia);
    formData.append('qtdPessoas', inspection.qtdPessoas);
    formData.append('qtdComodos', inspection.qtdComodos);
    formData.append('numLampadas', inspection.numLampadas);
    formData.append('numTvs', inspection.numTvs);
    formData.append('numVentiladores', inspection.numVentiladores);
    formData.append('numVentiladoresTeto', inspection.numVentiladoresTeto);
    formData.append('numArCondicionados', inspection.numArCondicionados);
    formData.append('numGeladeiras', inspection.numGeladeiras);
    formData.append('numChuveiros', inspection.numChuveiros);
    formData.append('numMaquinasLavar', inspection.numMaquinasLavar);
    formData.append('numFreezers', inspection.numFreezers);
    formData.append('checklist', inspection.checklist.join(', '));
    formData.append('observacoesFinais', inspection.observacoesFinais);

    inspection.photosImovel.forEach((photo) => {
      formData.append('photosImovel', photo.original, photo.name);
    });

    inspection.photosMedidor.forEach((photo) => {
      formData.append('photosMedidor', photo.original, photo.name);
    });

    xhr.send(formData);
  });
}
