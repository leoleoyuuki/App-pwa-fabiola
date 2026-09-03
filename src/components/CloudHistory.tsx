import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { 
  Send,
  CheckCircle,
  FileEdit,
  Search, 
  RefreshCw, 
  FileSpreadsheet, 
  ChevronRight, 
  X, 
  ExternalLink,
  Loader2,
  Calendar,
  User,
  Zap,
  Home,
  Tv,
  CheckSquare,
  FileText
} from 'lucide-react';

import type { DraftData } from '../utils/db';
import { compressImageForDrive, resizeImageForPdf } from '../utils/syncService';

interface CloudHistoryProps {
  webhookUrl: string;
  isOnline: boolean;
  userEmail?: string;
  onEditRecord?: (draft: DraftData) => void;
}

function normalizeCloudRecord(rec: any): any {
  if (!rec || typeof rec !== 'object') return rec;
  
  const get = (...keys: string[]): string => {
    for (const k of keys) {
      if (rec[k] !== undefined && rec[k] !== null && String(rec[k]).trim() !== '') {
        return String(rec[k]);
      }
    }
    const cleanKeys: Record<string, any> = {};
    for (const ok of Object.keys(rec)) {
      const norm = ok.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      if (norm && rec[ok] !== undefined && rec[ok] !== null) {
        cleanKeys[norm] = rec[ok];
      }
    }
    for (const k of keys) {
      const normK = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      if (cleanKeys[normK] !== undefined && cleanKeys[normK] !== null && String(cleanKeys[normK]).trim() !== '') {
        return String(cleanKeys[normK]);
      }
    }
    return '';
  };

  return {
    ...rec,
    DatadeEnvio: get('DatadeEnvio', 'Data de Envio', 'datadeenvio', 'timestamp', 'dataenvio'),
    NomedoAutor: get('NomedoAutor', 'Nome do Autor', 'nomedoautor', 'autor'),
    NúmerodoProcesso: get('NúmerodoProcesso', 'Número do Processo', 'numerodoprocesso', 'processo', 'numprocesso', 'nmerodoprocesso'),
    'Réu/Concessionária': get('Réu/Concessionária', 'Réu / Concessionária', 'RéuConcessionária', 'reuconcessionaria', 'nomedoreu', 'reu', 'ruconcessionria'),
    RéuConcessionária: get('RéuConcessionária', 'Réu / Concessionária', 'reuconcessionaria', 'nomedoreu', 'reu', 'ruconcessionria'),
    TipodeAção: get('TipodeAção', 'Tipo de Ação', 'tipodeacao', 'tipoacao', 'acao', 'tipodeao'),
    DatadaVistoria: get('DatadaVistoria', 'Data da Vistoria', 'datadavistoria', 'datavistoria'),
    NºdaVistoria: get('NºdaVistoria', 'Nº da Vistoria', 'NdaVistoria', 'ndavistoria', 'numerovistoria'),
    PeríododaVistoria: get('PeríododaVistoria', 'Período da Vistoria', 'PerododaVistoria', 'periododavistoria', 'periodo'),
    'RepresentaçãoAutorPresente?': get('RepresentaçãoAutorPresente?', 'Representação Autor Presente?', 'RepresentaçãoAutorPresente', 'representacaoautorpresente', 'repautor', 'representaoautorpresente'),
    RepresentaçãoAutorPresente: get('RepresentaçãoAutorPresente', 'Representação Autor Presente?', 'representacaoautorpresente', 'representaoautorpresente'),
    'RepresentaçãoRéuPresente?': get('RepresentaçãoRéuPresente?', 'Representação Réu Presente?', 'RepresentaçãoRéuPresente', 'representacaoreupresente', 'repreu', 'representaorupresente'),
    RepresentaçãoRéuPresente: get('RepresentaçãoRéuPresente', 'Representação Réu Presente?', 'representacaoreupresente', 'representaorupresente'),
    'Obs.PresençadasPartes': get('Obs.PresençadasPartes', 'Obs. Presença das Partes', 'ObsPresençadasPartes', 'obspresencadaspartes', 'obspresenca', 'obspresenadaspartes'),
    NúmerodoMedidor: get('NúmerodoMedidor', 'Número do Medidor', 'numerodomedidor', 'medidor', 'nummedidor', 'nmerodomedidor'),
    'MedidorcomChip?': get('MedidorcomChip?', 'Medidor com Chip?', 'MedidorcomChip', 'medidorcomchip'),
    MedidorcomChip: get('MedidorcomChip', 'Medidor com Chip?', 'medidorcomchip'),
    CondiçõesdoMedidor: get('CondiçõesdoMedidor', 'Condições do Medidor', 'condicoesdomedidor', 'condicoesmedidor', 'condiesdomedidor'),
    CortedeEnergia: get('CortedeEnergia', 'Corte de Energia?', 'CortedeEnergia?', 'cortedeenergia'),
    PessoasResidentes: get('PessoasResidentes', 'Pessoas Residentes', 'pessoasresidentes', 'qtdPessoas'),
    QuantidadedeCômodos: get('QuantidadedeCômodos', 'Quantidade de Cômodos', 'quantidadedecomodos', 'qtdComodos', 'comodos', 'quantidadedecmodos'),
    NºdeLâmpadas: get('NºdeLâmpadas', 'Nº de Lâmpadas', 'NdeLampadas', 'ndelampadas', 'lampadas', 'numLampadas', 'ndelpadas'),
    NºdeTVs: get('NºdeTVs', 'Nº de TVs', 'NdeTVs', 'ndetvs', 'tvs', 'numTvs'),
    NºdeVentiladores: get('NºdeVentiladores', 'Nº de Ventiladores', 'NdeVentiladores', 'ndeventiladores', 'ventiladores', 'numVentiladores'),
    NºdeVentiladoresdeTeto: get('NºdeVentiladoresdeTeto', 'Nº de Ventiladores de Teto', 'NdeVentiladoresdeTeto', 'ndeventiladoresdeteto', 'numVentiladoresTeto'),
    NºdeArCondicionados: get('NºdeArCondicionados', 'Nº de Ar Condicionados', 'NdeArCondicionados', 'ndearcondicionados', 'numArCondicionados'),
    NºdeGeladeiras: get('NºdeGeladeiras', 'Nº de Geladeiras', 'NdeGeladeiras', 'ndegeladeiras', 'numGeladeiras'),
    NºdeChuveirosElétricos: get('NºdeChuveirosElétricos', 'Nº de Chuveiros Elétricos', 'NdeChuveirosEletricos', 'ndechuveiroseletricos', 'numChuveiros', 'ndechuveiroseltricos'),
    NºdeMáquinasdeLavar: get('NºdeMáquinasdeLavar', 'Nº de Máquinas de Lavar', 'NdeMaquinasdeLavar', 'ndemaquinasdelavar', 'numMaquinasLavar', 'ndemquinasdelavar'),
    NºdeFreezers: get('NºdeFreezers', 'Nº de Freezers', 'NdeFreezers', 'ndefreezers', 'numFreezers'),
    ChecklistTécnico: get('ChecklistTécnico', 'Checklist Técnico', 'checklisttecnico', 'checklist', 'checklisttcnico'),
    ObservaçõesFinaisdoPerito: get('ObservaçõesFinaisdoPerito', 'Observações Finais do Perito', 'observacoesfinaisdoperito', 'observacoesfinais', 'observaesfinaisdoperito'),
    'LinkdaPasta(GoogleDrive)': get('LinkdaPasta(GoogleDrive)', 'Link da Pasta (Google Drive)', 'LinkdaPastaGoogleDrive', 'linkdapastagoogledrive', 'linkpasta', 'folderUrl'),
    LinkdaPastaGoogleDrive: get('LinkdaPastaGoogleDrive', 'Link da Pasta (Google Drive)', 'linkdapastagoogledrive', 'folderUrl')
  };
}

export const CloudHistory: React.FC<CloudHistoryProps> = ({
  webhookUrl,
  isOnline,
  userEmail,
  onEditRecord
}) => {
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'today' | 'custom'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Manipulador para Retomar Vistoria (Edição)
  const handleResumeInspection = (rec: any) => {
    if (!rec) return;
    const draft: DraftData = {
      id: 'draft_resume_' + Date.now(),
      nomeAutor: rec.NomedoAutor || '',
      numeroProcesso: rec.NúmerodoProcesso || '',
      reuConcessionaria: rec['Réu/Concessionária'] || rec.RéuConcessionária || '',
      tipoAcao: rec.TipodeAção || 'Consumo',
      dataVistoria: normalizeToYMD(rec.DatadaVistoria) || rec.DatadaVistoria || '',
      numeroVistoria: rec.NºdaVistoria || '1',
      periodoVistoria: rec.PeríododaVistoria || 'Manhã 09 - 12 h',
      representacaoAutor: rec['RepresentaçãoAutorPresente?'] || rec.RepresentaçãoAutorPresente || 'Sim',
      representacaoReu: rec['RepresentaçãoRéuPresente?'] || rec.RepresentaçãoRéuPresente || 'Sim',
      observacoesPresenca: rec['Obs.PresençadasPartes'] || '',
      numeroMedidor: rec.NúmerodoMedidor || '',
      medidorChip: rec['MedidorcomChip?'] || rec.MedidorcomChip || 'Não',
      condicoesMedidor: rec.CondiçõesdoMedidor || 'Boa (Lacrado)',
      corteEnergia: rec.CortedeEnergia || 'Não',
      observacoesMedidor: '',
      qtdPessoas: rec.PessoasResidentes || '1',
      qtdComodos: rec.QuantidadedeCômodos || '1',
      numLampadas: rec.NºdeLâmpadas || '',
      numTvs: rec.NºdeTVs || '0',
      numVentiladores: rec.NºdeVentiladores || '0',
      numVentiladoresTeto: rec.NºdeVentiladoresdeTeto || '0',
      numArCondicionados: rec.NºdeArCondicionados || '0',
      numGeladeiras: rec.NºdeGeladeiras || '0',
      numChuveiros: rec.NºdeChuveirosElétricos || '0',
      numMaquinasLavar: rec.NºdeMáquinasdeLavar || '0',
      numFreezers: rec.NºdeFreezers || '0',
      checklist: rec.ChecklistTécnico ? rec.ChecklistTécnico.split(',').map((s: string) => s.trim()) : [],
      observacoesFinais: rec.ObservaçõesFinaisdoPerito || '',
      photosImovel: [],
      photosMedidor: [],
      updatedAt: new Date().toISOString()
    };

    setSelectedRecord(null);
    onEditRecord?.(draft);
  };

  // Manipulador para Reenviar Vistoria para o Apps Script
  const handleResendInspection = async (rec: any) => {
    if (!webhookUrl || !webhookUrl.includes('script.google.com')) {
      setResendStatus({ type: 'error', message: 'URL do Google Script inválida.' });
      return;
    }

    setIsResending(true);
    setResendStatus(null);

    try {
      // 1. Obtém o link da pasta de origem no Google Drive
      const pastaOrigemUrl = rec['LinkdaPasta(GoogleDrive)'] || rec.LinkdaPastaGoogleDrive || rec.folderUrl || '';

      // 2. Tenta recuperar fotografias locais salvas no IndexedDB deste aparelho
      const photosImovelPayload: any[] = [];
      const photosMedidorPayload: any[] = [];
      let fotosLocaisEncontradas = 0;

      try {
        const drafts = await db.getAllDrafts(userEmail);
        const procLimpo = (rec.NúmerodoProcesso || '').replace(/\D/g, '');
        const autorLimpo = (rec.NomedoAutor || '').trim().toLowerCase();

        const match = drafts.find(d => {
          const dProc = (d.numeroProcesso || '').replace(/\D/g, '');
          const dAutor = (d.nomeAutor || '').trim().toLowerCase();
          return (procLimpo && dProc && procLimpo === dProc) || (autorLimpo && dAutor && autorLimpo === dAutor);
        });

        if (match) {
          if (match.photosImovel && match.photosImovel.length > 0) {
            for (const p of match.photosImovel) {
              if (p.original) {
                const b64 = await compressImageForDrive(p.original);
                const pdfB64 = await resizeImageForPdf(p.original);
                photosImovelPayload.push({ name: p.name, type: p.type, base64: b64, pdfBase64: pdfB64 });
                fotosLocaisEncontradas++;
              }
            }
          }
          if (match.photosMedidor && match.photosMedidor.length > 0) {
            for (const p of match.photosMedidor) {
              if (p.original) {
                const b64 = await compressImageForDrive(p.original);
                const pdfB64 = await resizeImageForPdf(p.original);
                photosMedidorPayload.push({ name: p.name, type: p.type, base64: b64, pdfBase64: pdfB64 });
                fotosLocaisEncontradas++;
              }
            }
          }
        }
      } catch (eLocal) {
        console.warn('Verificação de fotos locais no IndexedDB ignorada:', eLocal);
      }

      const payload = {
        id: 'resend_' + Date.now(),
        createdAt: new Date().toISOString(),
        peritoEmail: userEmail || '',
        pastaOrigemUrl: pastaOrigemUrl,
        photosImovel: photosImovelPayload,
        photosMedidor: photosMedidorPayload,
        nomeAutor: rec.NomedoAutor || '',
        numeroProcesso: rec.NúmerodoProcesso || '',
        reuConcessionaria: rec['Réu/Concessionária'] || rec.RéuConcessionária || '',
        tipoAcao: rec.TipodeAção || 'Consumo',
        dataVistoria: normalizeToYMD(rec.DatadaVistoria) || rec.DatadaVistoria || '',
        numeroVistoria: rec.NºdaVistoria || '1',
        periodoVistoria: rec.PeríododaVistoria || 'Manhã 09 - 12 h',
        representacaoAutor: rec['RepresentaçãoAutorPresente?'] || rec.RepresentaçãoAutorPresente || 'Sim',
        representacaoReu: rec['RepresentaçãoRéuPresente?'] || rec.RepresentaçãoRéuPresente || 'Sim',
        observacoesPresenca: rec['Obs.PresençadasPartes'] || '',
        numeroMedidor: rec.NúmerodoMedidor || '',
        medidorChip: rec['MedidorcomChip?'] || rec.MedidorcomChip || 'Não',
        condicoesMedidor: rec.CondiçõesdoMedidor || 'Boa (Lacrado)',
        corteEnergia: rec.CortedeEnergia || 'Não',
        observacoesMedidor: '',
        qtdPessoas: rec.PessoasResidentes || '1',
        qtdComodos: rec.QuantidadedeCômodos || '1',
        numLampadas: rec.NºdeLâmpadas || '',
        numTvs: rec.NºdeTVs || '0',
        numVentiladores: rec.NºdeVentiladores || '0',
        numVentiladoresTeto: rec.NºdeVentiladoresdeTeto || '0',
        numArCondicionados: rec.NºdeArCondicionados || '0',
        numGeladeiras: rec.NºdeGeladeiras || '0',
        numChuveiros: rec.NºdeChuveirosElétricos || '0',
        numMaquinasLavar: rec.NºdeMáquinasdeLavar || '0',
        numFreezers: rec.NºdeFreezers || '0',
        checklist: rec.ChecklistTécnico ? rec.ChecklistTécnico.split(',').map((s: string) => s.trim()) : [],
        observacoesFinais: rec.ObservaçõesFinaisdoPerito || ''
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('HTTP Status: ' + response.status);
      }

      const resJson = await response.json();
      if (resJson.status === 'erro') {
        throw new Error(resJson.message || 'Erro no Apps Script');
      }

      const fotosMsg = fotosLocaisEncontradas > 0 
        ? ` (${fotosLocaisEncontradas} fotos locais anexadas)`
        : (pastaOrigemUrl ? ' (fotos replicadas da pasta do Google Drive)' : '');

      setResendStatus({
        type: 'success',
        message: `Vistoria e Laudo reenviados com sucesso!${fotosMsg}`
      });
      fetchRecords();
    } catch (err: any) {
      console.error('Erro ao reenviar:', err);
      setResendStatus({
        type: 'error',
        message: 'Falha no reenvio: ' + (err.message || err)
      });
    } finally {
      setIsResending(false);
    }
  };

  // Helper: Get today in YYYY-MM-DD format
  const getTodayYMD = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper: Clean date string from trailing 00:00 or convert ISO to DD/MM/YYYY
  const cleanDateOnly = (val: string | undefined): string => {
    if (!val) return 'S/D';
    let clean = String(val).replace(/\s+00:00(:00)?$/, '').trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      const [y, m, d] = clean.substring(0, 10).split('-');
      return `${d}/${m}/${y}`;
    }
    return clean;
  };

  // Helper: Normalize any date string (BR or ISO) to YYYY-MM-DD
  const normalizeToYMD = (val: string | undefined): string => {
    if (!val) return '';
    const str = String(val).trim();
    const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (brMatch) {
      const d = brMatch[1].padStart(2, '0');
      const m = brMatch[2].padStart(2, '0');
      const y = brMatch[3];
      return `${y}-${m}-${d}`;
    }
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    return '';
  };

  // Load cached records on mount or user change
  useEffect(() => {
    const loadCached = async () => {
      try {
        const cached = await db.getCloudRecords(userEmail);
        if (cached) {
          const normalized = cached.map(normalizeCloudRecord);
          setRecords(normalized);
          setFilteredRecords(normalized);
        }
      } catch (err) {
        console.error('Erro ao ler cache de registros:', err);
      }
    };
    loadCached();
    // Auto-fetch if online and we have a valid Google script URL
    if (isOnline && webhookUrl && webhookUrl.includes('script.google.com')) {
      fetchRecords();
    }
  }, [webhookUrl, isOnline, userEmail]);

  // Filter records dynamically when search term, date filter, or records change
  useEffect(() => {
    let result = records;

    // 1. Date Filter
    if (dateFilterMode === 'today') {
      const todayYMD = getTodayYMD();
      result = result.filter(rec => {
        const dVistoria = normalizeToYMD(rec.DatadaVistoria);
        const dEnvio = normalizeToYMD(rec.DatadeEnvio);
        return dVistoria === todayYMD || dEnvio === todayYMD;
      });
    } else if (dateFilterMode === 'custom' && selectedDate) {
      result = result.filter(rec => {
        const dVistoria = normalizeToYMD(rec.DatadaVistoria);
        const dEnvio = normalizeToYMD(rec.DatadeEnvio);
        return dVistoria === selectedDate || dEnvio === selectedDate;
      });
    }

    // 2. Search Term Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(rec => {
        const nome = (rec.NomedoAutor || '').toLowerCase();
        const proc = (rec.NúmerodoProcesso || '').toLowerCase();
        const reu = (rec.RéuConcessionária || rec['Réu/Concessionária'] || '').toLowerCase();
        const med = (rec.NúmerodoMedidor || '').toLowerCase();
        return nome.includes(term) || proc.includes(term) || reu.includes(term) || med.includes(term);
      });
    }

    setFilteredRecords(result);
  }, [searchTerm, dateFilterMode, selectedDate, records]);

  // Count reports for today
  const todayCount = records.filter(rec => {
    const todayYMD = getTodayYMD();
    return normalizeToYMD(rec.DatadaVistoria) === todayYMD || normalizeToYMD(rec.DatadeEnvio) === todayYMD;
  }).length;

  // Fetch records from Google Apps Script
  const fetchRecords = async () => {
    if (!webhookUrl || !webhookUrl.includes('script.google.com')) {
      setErrorMsg('Configure uma URL de Web App do Google Apps Script válida nas configurações.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const peritoQuery = userEmail ? `?perito=${encodeURIComponent(userEmail)}` : '';
      const response = await fetch(`${webhookUrl}${peritoQuery}`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Erro HTTP: Status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      let recordsList: any[] = [];
      if (Array.isArray(data)) {
        recordsList = data;
      } else if (data && typeof data === 'object') {
        recordsList = data.relatorios || data.records || data.processos || data.data || [];
      } else {
        throw new Error('Formato de resposta inesperado do Google Script.');
      }

      const normalized = recordsList.map(normalizeCloudRecord);
      const sorted = [...normalized].reverse();
      setRecords(sorted);
      setFilteredRecords(sorted);
      await db.saveCloudRecords(sorted, userEmail); // Cache locally per perito
    } catch (err: any) {
      console.error('Erro ao ler registros da planilha:', err);
      setErrorMsg(`Erro de conexão: ${err.message || err}`);
      
      // Load cache if fetch fails
      const cached = await db.getCloudRecords(userEmail);
      if (cached) {
        const normalized = cached.map(normalizeCloudRecord);
        setRecords(normalized);
        setFilteredRecords(normalized);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '16px 16px 120px 16px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', fontWeight: 400, color: 'var(--text-primary)' }}>
          Relatórios Enviados
        </h1>
        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
          Registros sincronizados com o Google Sheets
        </p>
      </div>

      {/* Control Actions & Search */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
          <div className="form-group" style={{ flexGrow: 1, marginBottom: 0, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0', top: '12px', color: 'var(--text-secondary)' }}>
              <Search size={16} />
            </span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por Autor, Processo, Réu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '28px' }}
            />
          </div>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={fetchRecords} 
            disabled={isLoading || !isOnline}
            style={{ width: '44px', height: '44px', padding: 0, flexShrink: 0, borderRadius: 'var(--radius-sm)' }}
            title="Atualizar dados da nuvem"
          >
            {isLoading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
          </button>
        </div>

        {/* Date Filter Section */}
        <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} style={{ color: 'var(--accent-gold)' }} />
              Filtrar por Data
            </span>
            {dateFilterMode !== 'all' && (
              <button
                type="button"
                onClick={() => setDateFilterMode('all')}
                style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Limpar filtro
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setDateFilterMode('today')}
              className={`btn ${dateFilterMode === 'today' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.75rem', height: '34px', borderRadius: 'var(--radius-xs)', flexGrow: 0 }}
            >
              Hoje ({todayCount})
            </button>

            <button
              type="button"
              onClick={() => setDateFilterMode('all')}
              className={`btn ${dateFilterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.75rem', height: '34px', borderRadius: 'var(--radius-xs)', flexGrow: 0 }}
            >
              Todos ({records.length})
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexGrow: 1, minWidth: '140px' }}>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateFilterMode('custom');
                }}
                style={{
                  height: '34px',
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-xs)',
                  border: dateFilterMode === 'custom' ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                  backgroundColor: dateFilterMode === 'custom' ? 'var(--accent-gold-light)' : 'transparent'
                }}
              />
            </div>
          </div>
        </div>

        {!isOnline && (
          <p style={{ fontSize: '0.75rem', color: 'var(--accent-rust)', fontStyle: 'italic', textAlign: 'center', marginTop: '12px' }}>
            Modo offline - Exibindo dados do cache local. Conecte-se para atualizar.
          </p>
        )}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: 'var(--accent-rust-light)', color: 'var(--accent-rust)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '20px' }}>
          <X size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Records Counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {filteredRecords.length === 1 ? '1 relatório encontrado' : `${filteredRecords.length} relatórios encontrados`}
        </span>
      </div>

      {/* Records List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <FileSpreadsheet size={32} style={{ color: 'var(--text-secondary)', marginBottom: '12px', marginInline: 'auto' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isLoading ? 'Carregando planilha...' : 'Nenhum relatório encontrado para o filtro selecionado.'}
            </p>
          </div>
        ) : (
          filteredRecords.map((rec, index) => (
            <div 
              key={index} 
              className="card" 
              onClick={() => { setResendStatus(null); setSelectedRecord(rec); }}
              style={{ 
                padding: '16px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer' 
              }}
            >
              <div style={{ paddingRight: '12px', flexGrow: 1 }}>
                <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
                  {rec.NomedoAutor || 'Autor sem nome'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Proc: {rec.NúmerodoProcesso || 'Não especificado'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>📅 Vistoria: <strong>{cleanDateOnly(rec.DatadaVistoria)}</strong></span>
                  {rec.DatadeEnvio && (
                    <span>🕒 Envio: <strong>{rec.DatadeEnvio}</strong></span>
                  )}
                  <span>⚡ {rec.TipodeAção || 'Consumo'}</span>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
            </div>
          ))
        )}
      </div>

      {/* Details View Modal */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(31, 32, 34, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="card fade-in" style={{ 
            maxWidth: '500px', 
            width: '100%', 
            maxHeight: '85vh', 
            overflowY: 'auto', 
            padding: '24px',
            position: 'relative'
          }}>
            
            {/* Close Button */}
            <button 
              type="button" 
              onClick={() => setSelectedRecord(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '20px', paddingRight: '24px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-gold)', fontWeight: 600 }}>
                Detalhes do Relatório
              </span>
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
                {selectedRecord.NomedoAutor}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Sincronizado em: {selectedRecord.DatadeEnvio || 'S/D'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Block 1: Dados Gerais */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <User size={12} /> DADOS GERAIS
                </span>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Processo:</strong> {selectedRecord.NúmerodoProcesso || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Réu / Concessionária:</strong> {selectedRecord['Réu/Concessionária'] || selectedRecord.RéuConcessionária || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Tipo de Ação:</strong> {selectedRecord.TipodeAção || 'Não informado'}</p>
              </div>

              {/* Block 2: Vistoria */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Calendar size={12} /> DADOS DA VISTORIA
                </span>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Data da Vistoria:</strong> {cleanDateOnly(selectedRecord.DatadaVistoria)}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Nº da Vistoria:</strong> {selectedRecord.NºdaVistoria || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Período:</strong> {selectedRecord.PeríododaVistoria || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Representante Autor:</strong> {selectedRecord['RepresentaçãoAutorPresente?'] || selectedRecord.RepresentaçãoAutorPresente || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Representante Réu:</strong> {selectedRecord['RepresentaçãoRéuPresente?'] || selectedRecord.RepresentaçãoRéuPresente || 'Não informado'}</p>
                {selectedRecord['Obs.PresençadasPartes'] && (
                  <p style={{ fontSize: '0.85rem', margin: '8px 0 4px 0', padding: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', fontStyle: 'italic' }}>
                    <strong>Observações de Presença:</strong> {selectedRecord['Obs.PresençadasPartes']}
                  </p>
                )}
              </div>

              {/* Block 3: Medidor */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Zap size={12} /> MEDIDOR DE ENERGIA
                </span>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Número do Medidor:</strong> {selectedRecord.NúmerodoMedidor || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Possui Chip?</strong> {selectedRecord['MedidorcomChip?'] || selectedRecord.MedidorcomChip || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Condições Visuais:</strong> {selectedRecord.CondiçõesdoMedidor || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Houve Corte?</strong> {selectedRecord.CortedeEnergia || selectedRecord['Corte de Energia?'] || 'Não informado'}</p>
              </div>

              {/* Block 4: Características */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Home size={12} /> UNIDADE CONSUMIDORA
                </span>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Pessoas Residentes:</strong> {selectedRecord.PessoasResidentes || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Cômodos da UC:</strong> {selectedRecord.QuantidadedeCômodos || 'Não informado'}</p>
              </div>

              {/* Block 5: Eletrodomésticos */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Tv size={12} /> APARELHOS CADASTRADOS
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', marginTop: '6px' }}>
                  <div>💡 Lâmpadas: <strong>{selectedRecord.NºdeLâmpadas || 0}</strong></div>
                  <div>📺 TVs: <strong>{selectedRecord.NºdeTVs || 0}</strong></div>
                  <div>💨 Ventiladores: <strong>{selectedRecord.NºdeVentiladores || 0}</strong></div>
                  <div>🌀 Vent. Teto: <strong>{selectedRecord.NºdeVentiladoresdeTeto || 0}</strong></div>
                  <div>❄️ Ar Condicionado: <strong>{selectedRecord.NºdeArCondicionados || 0}</strong></div>
                  <div>🧊 Geladeiras: <strong>{selectedRecord.NºdeGeladeiras || 0}</strong></div>
                  <div>🚿 Chuveiro Elétrico: <strong>{selectedRecord.NºdeChuveirosElétricos || 0}</strong></div>
                  <div>🧺 Máquina Lavar: <strong>{selectedRecord.NºdeMáquinasdeLavar || 0}</strong></div>
                  <div>🥶 Freezers: <strong>{selectedRecord.NºdeFreezers || 0}</strong></div>
                </div>
              </div>

              {/* Block 6: Checklist */}
              {selectedRecord.ChecklistTécnico && (
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <CheckSquare size={12} /> CHECKLIST TÉCNICO
                  </span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {selectedRecord.ChecklistTécnico}
                  </p>
                </div>
              )}

              {/* Block 7: Observações Finais */}
              {selectedRecord.ObservaçõesFinaisdoPerito && (
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <FileText size={12} /> OBSERVAÇÕES DO PERITO
                  </span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                    {selectedRecord.ObservaçõesFinaisdoPerito}
                  </p>
                </div>
              )}

              {/* Feedback de Reenvio */}
              {resendStatus && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: resendStatus.type === 'success' ? '#e6f4ea' : '#fce8e6',
                  color: resendStatus.type === 'success' ? '#137333' : '#c5221f',
                  marginTop: '8px'
                }}>
                  {resendStatus.type === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
                  <span>{resendStatus.message}</span>
                </div>
              )}

              {/* Barra de Ações: Retomar Vistoria e Reenviar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleResumeInspection(selectedRecord)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 10px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--accent-gold)',
                    color: 'var(--accent-gold)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  <FileEdit size={16} />
                  Retomar Vistoria
                </button>

                <button
                  type="button"
                  className="btn btn-gold"
                  disabled={isResending || !isOnline}
                  onClick={() => handleResendInspection(selectedRecord)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 10px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    opacity: (isResending || !isOnline) ? 0.7 : 1,
                    cursor: (isResending || !isOnline) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isResending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                  {isResending ? 'Reenviando...' : 'Reenviar'}
                </button>
              </div>

              {/* Link do Google Drive */}
              {(selectedRecord['LinkdaPasta(GoogleDrive)'] || selectedRecord.LinkdaPastaGoogleDrive) && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const url = selectedRecord['LinkdaPasta(GoogleDrive)'] || selectedRecord.LinkdaPastaGoogleDrive;
                    window.open(url, '_blank');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    fontSize: '0.82rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  <ExternalLink size={15} />
                  Abrir Pasta no Google Drive
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
