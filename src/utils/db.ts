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

const cacheStore = localforage.createInstance({
  name: 'fabiola_inspection',
  storeName: 'cache'
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
  observacoesMedidor?: string;
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

export interface DraftData extends Omit<InspectionData, 'id' | 'createdAt'> {
  id: string;
  updatedAt: string;
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

export const db = {
  // --- Draft Management (Multi-draft with real-time autosave) ---
  async saveDraft(data: DraftData, peritoEmail?: string): Promise<void> {
    const draftKey = `draft_${data.id}`;
    const email = peritoEmail || data.peritoEmail || '';
    const draftToSave: DraftData = {
      ...data,
      peritoEmail: email,
      updatedAt: data.updatedAt || new Date().toISOString()
    };
    
    // Save the specific draft
    await draftStore.setItem(draftKey, draftToSave);
    
    // Track active draft for this perito
    const activeKey = email ? `active_draft_${email}` : 'active_draft';
    await draftStore.setItem(activeKey, data.id);
  },

  async getAllDrafts(peritoEmail?: string): Promise<DraftData[]> {
    const keys = await draftStore.keys();
    const drafts: DraftData[] = [];
    
    for (const key of keys) {
      if (key.startsWith('draft_')) {
        const draft = await draftStore.getItem<DraftData>(key);
        if (draft && draft.id) {
          if (!peritoEmail || !draft.peritoEmail || draft.peritoEmail === peritoEmail) {
            drafts.push(draft);
          }
        }
      }
    }
    
    // Sort newest updated first
    return drafts.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  },

  async getActiveDraft(peritoEmail?: string): Promise<DraftData | null> {
    const activeKey = peritoEmail ? `active_draft_${peritoEmail}` : 'active_draft';
    const activeId = await draftStore.getItem<string>(activeKey);
    
    if (activeId) {
      const draft = await draftStore.getItem<DraftData>(`draft_${activeId}`);
      if (draft) return draft;
    }
    
    // Fallback: check legacy draft key
    const legacyKey = peritoEmail ? `draft_${peritoEmail}` : 'current_draft';
    const legacyDraft = await draftStore.getItem<any>(legacyKey);
    if (legacyDraft && !legacyDraft.id) {
      const migratedDraft: DraftData = {
        ...legacyDraft,
        id: `draft_${Date.now()}`,
        updatedAt: new Date().toISOString(),
        peritoEmail: peritoEmail
      };
      await this.saveDraft(migratedDraft, peritoEmail);
      await draftStore.removeItem(legacyKey);
      return migratedDraft;
    }
    
    return null;
  },

  async getDraftById(id: string): Promise<DraftData | null> {
    return await draftStore.getItem<DraftData>(`draft_${id}`);
  },

  async setActiveDraft(id: string, peritoEmail?: string): Promise<void> {
    const activeKey = peritoEmail ? `active_draft_${peritoEmail}` : 'active_draft';
    await draftStore.setItem(activeKey, id);
  },

  async deleteDraft(id: string, peritoEmail?: string): Promise<void> {
    await draftStore.removeItem(`draft_${id}`);
    const activeKey = peritoEmail ? `active_draft_${peritoEmail}` : 'active_draft';
    const currentActiveId = await draftStore.getItem<string>(activeKey);
    if (currentActiveId === id) {
      await draftStore.removeItem(activeKey);
    }
  },

  async clearActiveDraft(peritoEmail?: string): Promise<void> {
    const activeKey = peritoEmail ? `active_draft_${peritoEmail}` : 'active_draft';
    await draftStore.removeItem(activeKey);
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
