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
    const photosImovelWithBase64: { name: string; type: string; base64: string }[] = [];
    const photosMedidorWithBase64: { name: string; type: string; base64: string }[] = [];
    const totalPhotos = inspection.photosImovel.length + inspection.photosMedidor.length;
    let convertedCount = 0;

    // Convert photosImovel
    for (let i = 0; i < inspection.photosImovel.length; i++) {
      const photo = inspection.photosImovel[i];
      onProgress({
        loaded: convertedCount,
        total: totalPhotos,
        percentage: Math.round((convertedCount / totalPhotos) * 30)
      });
      const base64 = await blobToBase64(photo.original);
      photosImovelWithBase64.push({
        name: photo.name,
        type: photo.type,
        base64
      });
      convertedCount++;
    }

    // Convert photosMedidor
    for (let i = 0; i < inspection.photosMedidor.length; i++) {
      const photo = inspection.photosMedidor[i];
      onProgress({
        loaded: convertedCount,
        total: totalPhotos,
        percentage: Math.round((convertedCount / totalPhotos) * 30)
      });
      const base64 = await blobToBase64(photo.original);
      photosMedidorWithBase64.push({
        name: photo.name,
        type: photo.type,
        base64
      });
      convertedCount++;
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
