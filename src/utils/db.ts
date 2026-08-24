import localforage from 'localforage';

// Configure localforage instances for different data stores
const draftStore = localforage.createInstance({
  name: 'fabiola_inspection',
  storeName: 'draft'
});

const queueStore = localforage.createInstance({
  name: 'fabiola_inspection',
  storeName: 'queue'
});

const historyStore = localforage.createInstance({
  name: 'fabiola_inspection',
  storeName: 'history'
});

export interface PhotoData {
  id: string;
  name: string;
  type: string;
  original: Blob;
  thumbnail: string; // Base64 dataURL for instant rendering
}

export interface InspectionData {
  id: string;
  createdAt: string;
  peritoEmail?: string;
  nomeAutor: string;
  numeroProcesso: string;
  reuConcessionaria: string;
  tipoAcao: string;
  dataVistoria: string;
  numeroVistoria: string;
  periodoVistoria: string;
  representacaoAutor: string;
  representacaoReu: string;
  observacoesPresenca: string;
  numeroMedidor: string;
  medidorChip: string;
  condicoesMedidor: string;
  corteEnergia: string;
  qtdPessoas: string;
  qtdComodos: string;
  numLampadas: string;
  numTvs: string;
  numVentiladores: string;
  numVentiladoresTeto: string;
  numArCondicionados: string;
  numGeladeiras: string;
  numChuveiros: string;
  numMaquinasLavar: string;
  numFreezers: string;
  checklist: string[];
  observacoesFinais: string;
  photosImovel: PhotoData[];
  photosMedidor: PhotoData[];
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  syncedAt: string;
  peritoEmail?: string;
  clientName: string;
  projectAddress: string;
  inspectorName: string;
  photoCount: number;
}

const cacheStore = localforage.createInstance({
  name: 'fabiola_inspection',
  storeName: 'cache'
});

export const db = {
  // --- Draft Management ---
  async saveDraft(data: Omit<InspectionData, 'id' | 'createdAt'>, peritoEmail?: string): Promise<void> {
    const key = peritoEmail ? `draft_${peritoEmail}` : 'current_draft';
    await draftStore.setItem(key, data);
  },

  async getDraft(peritoEmail?: string): Promise<Omit<InspectionData, 'id' | 'createdAt'> | null> {
    const key = peritoEmail ? `draft_${peritoEmail}` : 'current_draft';
    const draft = await draftStore.getItem<Omit<InspectionData, 'id' | 'createdAt'>>(key);
    if (!draft && peritoEmail) {
      return await draftStore.getItem<Omit<InspectionData, 'id' | 'createdAt'>>('current_draft');
    }
    return draft;
  },

  async clearDraft(peritoEmail?: string): Promise<void> {
    const key = peritoEmail ? `draft_${peritoEmail}` : 'current_draft';
    await draftStore.removeItem(key);
  },

  // --- Sync Queue (Pending Uploads) ---
  async addToQueue(inspection: InspectionData): Promise<void> {
    await queueStore.setItem(inspection.id, inspection);
  },

  async getQueue(peritoEmail?: string): Promise<InspectionData[]> {
    const keys = await queueStore.keys();
    let items: InspectionData[] = [];
    for (const key of keys) {
      const item = await queueStore.getItem<InspectionData>(key);
      if (item) {
        if (!peritoEmail || !item.peritoEmail || item.peritoEmail === peritoEmail) {
          items.push(item);
        }
      }
    }
    // Sort oldest first for FIFO syncing
    return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async removeFromQueue(id: string): Promise<void> {
    await queueStore.removeItem(id);
  },

  // --- Sync History (Metadata only to save device space) ---
  async addToHistory(inspection: InspectionData): Promise<void> {
    const historyItem: HistoryItem = {
      id: inspection.id,
      createdAt: inspection.createdAt,
      syncedAt: new Date().toISOString(),
      peritoEmail: inspection.peritoEmail,
      clientName: inspection.nomeAutor,
      projectAddress: inspection.numeroProcesso || 'S/N',
      inspectorName: inspection.tipoAcao,
      photoCount: inspection.photosImovel.length + inspection.photosMedidor.length
    };
    await historyStore.setItem(inspection.id, historyItem);
  },

  async getHistory(peritoEmail?: string): Promise<HistoryItem[]> {
    const keys = await historyStore.keys();
    let items: HistoryItem[] = [];
    for (const key of keys) {
      const item = await historyStore.getItem<HistoryItem>(key);
      if (item) {
        if (!peritoEmail || !item.peritoEmail || item.peritoEmail === peritoEmail) {
          items.push(item);
        }
      }
    }
    // Sort newest first
    return items.sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime());
  },

  // --- Cached Cloud Records from Google Sheets ---
  async saveCloudRecords(records: any[], peritoEmail?: string): Promise<void> {
    const key = peritoEmail ? `cloud_records_${peritoEmail}` : 'cloud_records';
    await cacheStore.setItem(key, records);
  },

  async getCloudRecords(peritoEmail?: string): Promise<any[] | null> {
    const key = peritoEmail ? `cloud_records_${peritoEmail}` : 'cloud_records';
    const data = await cacheStore.getItem<any[]>(key);
    if (!data && peritoEmail) {
      return await cacheStore.getItem<any[]>('cloud_records');
    }
    return data;
  },

  // --- Offline-Cached Scheduled Cases (Processos Cadastrados) ---
  async saveScheduledProcesses(processes: any[], peritoEmail?: string): Promise<void> {
    const key = peritoEmail ? `scheduled_processes_${peritoEmail}` : 'scheduled_processes';
    await cacheStore.setItem(key, processes);
  },

  async getScheduledProcesses(peritoEmail?: string): Promise<any[] | null> {
    const key = peritoEmail ? `scheduled_processes_${peritoEmail}` : 'scheduled_processes';
    const data = await cacheStore.getItem<any[]>(key);
    if (!data && peritoEmail) {
      return await cacheStore.getItem<any[]>('scheduled_processes');
    }
    return data;
  }
};
