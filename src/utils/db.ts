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
  async saveDraft(data: Omit<InspectionData, 'id' | 'createdAt'>): Promise<void> {
    await draftStore.setItem('current_draft', data);
  },

  async getDraft(): Promise<Omit<InspectionData, 'id' | 'createdAt'> | null> {
    return await draftStore.getItem<Omit<InspectionData, 'id' | 'createdAt'>>('current_draft');
  },

  async clearDraft(): Promise<void> {
    await draftStore.removeItem('current_draft');
  },

  // --- Sync Queue (Pending Uploads) ---
  async addToQueue(inspection: InspectionData): Promise<void> {
    await queueStore.setItem(inspection.id, inspection);
  },

  async getQueue(): Promise<InspectionData[]> {
    const keys = await queueStore.keys();
    const items: InspectionData[] = [];
    for (const key of keys) {
      const item = await queueStore.getItem<InspectionData>(key);
      if (item) items.push(item);
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
      clientName: inspection.nomeAutor,
      projectAddress: inspection.numeroProcesso || 'S/N',
      inspectorName: inspection.tipoAcao,
      photoCount: inspection.photosImovel.length + inspection.photosMedidor.length
    };
    await historyStore.setItem(inspection.id, historyItem);
  },

  async getHistory(): Promise<HistoryItem[]> {
    const keys = await historyStore.keys();
    const items: HistoryItem[] = [];
    for (const key of keys) {
      const item = await historyStore.getItem<HistoryItem>(key);
      if (item) items.push(item);
    }
    // Sort newest first
    return items.sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime());
  },

  // --- Cached Cloud Records from Google Sheets ---
  async saveCloudRecords(records: any[]): Promise<void> {
    await cacheStore.setItem('cloud_records', records);
  },

  async getCloudRecords(): Promise<any[] | null> {
    return await cacheStore.getItem<any[]>('cloud_records');
  }
};
