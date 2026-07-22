import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import type { PhotoData, InspectionData } from '../utils/db';
import { generateThumbnail } from '../utils/thumbnailGenerator';
import { 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Loader2, 
  Save, 
  CheckCircle,
  FileText,
  User,
  ClipboardList,
  Zap,
  Calendar,
  Users,
  CheckSquare,
  Home,
  Tv
} from 'lucide-react';

interface InspectionFormProps {
  onInspectionAdded: () => void;
  isOnline: boolean;
}

export const InspectionForm: React.FC<InspectionFormProps> = ({
  onInspectionAdded,
  isOnline
}) => {
  // Form fields
  const [nomeAutor, setNomeAutor] = useState('');
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [reuConcessionaria, setReuConcessionaria] = useState('');
  const [tipoAcao, setTipoAcao] = useState('Consumo');
  const [dataVistoria, setDataVistoria] = useState('');
  const [numeroVistoria, setNumeroVistoria] = useState('1');
  const [periodoVistoria, setPeriodoVistoria] = useState('Manhã 09 - 12 h');
  const [representacaoAutor, setRepresentacaoAutor] = useState('Sim');
  const [representacaoReu, setRepresentacaoReu] = useState('Sim');
  const [observacoesPresenca, setObservacoesPresenca] = useState('');
  const [numeroMedidor, setNumeroMedidor] = useState('');
  const [medidorChip, setMedidorChip] = useState('Não');
  const [condicoesMedidor, setCondicoesMedidor] = useState('Boa (Lacrado)');
  const [corteEnergia, setCorteEnergia] = useState('Não');
  const [qtdPessoas, setQtdPessoas] = useState('1');
  const [qtdComodos, setQtdComodos] = useState('1');
  const [numLampadas, setNumLampadas] = useState('');
  const [numTvs, setNumTvs] = useState('0');
  const [numVentiladores, setNumVentiladores] = useState('0');
  const [numVentiladoresTeto, setNumVentiladoresTeto] = useState('0');
  const [numArCondicionados, setNumArCondicionados] = useState('0');
  const [numGeladeiras, setNumGeladeiras] = useState('0');
  const [numChuveiros, setNumChuveiros] = useState('0');
  const [numMaquinasLavar, setNumMaquinasLavar] = useState('0');
  const [numFreezers, setNumFreezers] = useState('0');
  const [checklist, setChecklist] = useState<string[]>([]);
  const [observacoesFinais, setObservacoesFinais] = useState('');
  
  // Separate photo states
  const [photosImovel, setPhotosImovel] = useState<PhotoData[]>([]);
  const [photosMedidor, setPhotosMedidor] = useState<PhotoData[]>([]);

  // State flags
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Input refs for separate upload fields
  const cameraImovelRef = useRef<HTMLInputElement>(null);
  const galleryImovelRef = useRef<HTMLInputElement>(null);
  const cameraMedidorRef = useRef<HTMLInputElement>(null);
  const galleryMedidorRef = useRef<HTMLInputElement>(null);

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await db.getDraft();
        if (draft) {
          setNomeAutor(draft.nomeAutor || '');
          setNumeroProcesso(draft.numeroProcesso || '');
          setReuConcessionaria(draft.reuConcessionaria || '');
          setTipoAcao(draft.tipoAcao || 'Consumo');
          setDataVistoria(draft.dataVistoria || '');
          setNumeroVistoria(draft.numeroVistoria || '1');
          setPeriodoVistoria(draft.periodoVistoria || 'Manhã 09 - 12 h');
          setRepresentacaoAutor(draft.representacaoAutor || 'Sim');
          setRepresentacaoReu(draft.representacaoReu || 'Sim');
          setObservacoesPresenca(draft.observacoesPresenca || '');
          setNumeroMedidor(draft.numeroMedidor || '');
          setMedidorChip(draft.medidorChip || 'Não');
          setCondicoesMedidor(draft.condicoesMedidor || 'Boa (Lacrado)');
          setCorteEnergia(draft.corteEnergia || 'Não');
          setQtdPessoas(draft.qtdPessoas || '1');
          setQtdComodos(draft.qtdComodos || '1');
          setNumLampadas(draft.numLampadas || '');
          setNumTvs(draft.numTvs || '0');
          setNumVentiladores(draft.numVentiladores || '0');
          setNumVentiladoresTeto(draft.numVentiladoresTeto || '0');
          setNumArCondicionados(draft.numArCondicionados || '0');
          setNumGeladeiras(draft.numGeladeiras || '0');
          setNumChuveiros(draft.numChuveiros || '0');
          setNumMaquinasLavar(draft.numMaquinasLavar || '0');
          setNumFreezers(draft.numFreezers || '0');
          setChecklist(draft.checklist || []);
          setObservacoesFinais(draft.observacoesFinais || '');
          setPhotosImovel(draft.photosImovel || []);
          setPhotosMedidor(draft.photosMedidor || []);
          setDraftSavedAt('Rascunho recuperado');
        }
      } catch (err) {
        console.error('Erro ao carregar rascunho:', err);
      }
    };
    loadDraft();
  }, []);

  // Autosave draft on field changes
  useEffect(() => {
    const saveDraft = async () => {
      // Don't autosave if all fields are completely empty
      if (!nomeAutor && !numeroProcesso && !reuConcessionaria && !observacoesFinais && photosImovel.length === 0 && photosMedidor.length === 0) {
        return;
      }
      try {
        await db.saveDraft({
          nomeAutor,
          numeroProcesso,
          reuConcessionaria,
          tipoAcao,
          dataVistoria,
          numeroVistoria,
          periodoVistoria,
          representacaoAutor,
          representacaoReu,
          observacoesPresenca,
          numeroMedidor,
          medidorChip,
          condicoesMedidor,
          corteEnergia,
          qtdPessoas,
          qtdComodos,
          numLampadas,
          numTvs,
          numVentiladores,
          numVentiladoresTeto,
          numArCondicionados,
          numGeladeiras,
          numChuveiros,
          numMaquinasLavar,
          numFreezers,
          checklist,
          observacoesFinais,
          photosImovel,
          photosMedidor
        });
        const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setDraftSavedAt(`Rascunho salvo às ${now}`);
      } catch (err) {
        console.error('Erro ao salvar rascunho:', err);
      }
    };

    const timer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timer);
  }, [
    nomeAutor, numeroProcesso, reuConcessionaria, tipoAcao, dataVistoria,
    numeroVistoria, periodoVistoria, representacaoAutor, representacaoReu,
    observacoesPresenca, numeroMedidor, medidorChip, condicoesMedidor,
    corteEnergia, qtdPessoas, qtdComodos, numLampadas, numTvs,
    numVentiladores, numVentiladoresTeto, numArCondicionados, numGeladeiras,
    numChuveiros, numMaquinasLavar, numFreezers, checklist, observacoesFinais,
    photosImovel, photosMedidor
  ]);

  // Handle Photo input (Camera and Gallery share this)
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'imovel' | 'medidor') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoadingPhotos(true);
    setErrorMsg(null);

    const newPhotos: PhotoData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const thumbnail = await generateThumbnail(file);
        newPhotos.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          original: file,
          thumbnail
        });
      } catch (err) {
        console.error('Erro ao processar foto:', err);
        setErrorMsg('Algumas fotos não puderam ser carregadas. Tente novamente.');
      }
    }

    if (target === 'imovel') {
      setPhotosImovel(prev => [...prev, ...newPhotos]);
    } else {
      setPhotosMedidor(prev => [...prev, ...newPhotos]);
    }
    setIsLoadingPhotos(false);

    if (cameraImovelRef.current) cameraImovelRef.current.value = '';
    if (galleryImovelRef.current) galleryImovelRef.current.value = '';
    if (cameraMedidorRef.current) cameraMedidorRef.current.value = '';
    if (galleryMedidorRef.current) galleryMedidorRef.current.value = '';
  };

  const removePhoto = (id: string, target: 'imovel' | 'medidor') => {
    if (target === 'imovel') {
      setPhotosImovel(prev => prev.filter(p => p.id !== id));
    } else {
      setPhotosMedidor(prev => prev.filter(p => p.id !== id));
    }
  };

  // Submit report to sync queue
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nomeAutor.trim()) {
      setErrorMsg('O nome do Autor é obrigatório.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!dataVistoria) {
      setErrorMsg('A data da vistoria é obrigatória.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const inspection: InspectionData = {
      id: `insp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      nomeAutor: nomeAutor.trim(),
      numeroProcesso: numeroProcesso.trim(),
      reuConcessionaria: reuConcessionaria.trim(),
      tipoAcao,
      dataVistoria,
      numeroVistoria,
      periodoVistoria,
      representacaoAutor,
      representacaoReu,
      observacoesPresenca: observacoesPresenca.trim(),
      numeroMedidor: numeroMedidor.trim(),
      medidorChip,
      condicoesMedidor,
      corteEnergia,
      qtdPessoas,
      qtdComodos,
      numLampadas: numLampadas.trim(),
      numTvs,
      numVentiladores,
      numVentiladoresTeto,
      numArCondicionados,
      numGeladeiras,
      numChuveiros,
      numMaquinasLavar,
      numFreezers,
      checklist,
      observacoesFinais: observacoesFinais.trim(),
      photosImovel,
      photosMedidor
    };

    try {
      await db.addToQueue(inspection);
      await db.clearDraft();
      
      // Clear form states
      setNomeAutor('');
      setNumeroProcesso('');
      setReuConcessionaria('');
      setTipoAcao('Consumo');
      setDataVistoria('');
      setNumeroVistoria('1');
      setPeriodoVistoria('Manhã 09 - 12 h');
      setRepresentacaoAutor('Sim');
      setRepresentacaoReu('Sim');
      setObservacoesPresenca('');
      setNumeroMedidor('');
      setMedidorChip('Não');
      setCondicoesMedidor('Boa (Lacrado)');
      setCorteEnergia('Não');
      setQtdPessoas('1');
      setQtdComodos('1');
      setNumLampadas('');
      setNumTvs('0');
      setNumVentiladores('0');
      setNumVentiladoresTeto('0');
      setNumArCondicionados('0');
      setNumGeladeiras('0');
      setNumChuveiros('0');
      setNumMaquinasLavar('0');
      setNumFreezers('0');
      setChecklist([]);
      setObservacoesFinais('');
      setPhotosImovel([]);
      setPhotosMedidor([]);
      setDraftSavedAt(null);
      
      onInspectionAdded();
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Erro ao arquivar relatório:', err);
      setErrorMsg('Erro interno ao salvar relatório no celular.');
    }
  };

  // Helper selectors rendering custom buttons (Segmented controls) for touch
  const renderRadio = (
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    options: string[], 
    icon?: React.ReactNode
  ) => (
    <div className="form-group" style={{ marginBottom: '20px' }}>
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon} {label}
      </label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
        {options.map((opt) => {
          const isActive = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className="btn"
              style={{
                padding: '8px 12px',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isActive ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                backgroundColor: isActive ? 'var(--accent-gold-light)' : 'transparent',
                color: isActive ? 'var(--accent-gold-hover)' : 'var(--text-secondary)',
                textTransform: 'none',
                letterSpacing: 'normal',
                fontWeight: isActive ? 600 : 300,
                flexGrow: 1,
                textAlign: 'center'
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSelect = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    options: string[],
    icon?: React.ReactNode
  ) => (
    <div className="form-group" style={{ marginBottom: '20px' }}>
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon} {label}
      </label>
      <select
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none',
          backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'%231F2022\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '18px'
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  const toggleChecklistItem = (item: string) => {
    setChecklist(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const renderChecklist = (
    label: string,
    currentList: string[],
    options: string[],
    icon?: React.ReactNode
  ) => (
    <div className="form-group" style={{ marginBottom: '20px' }}>
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        {icon} {label}
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {options.map((opt) => {
          const isChecked = currentList.includes(opt);
          return (
            <label 
              key={opt} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 300,
                color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '8px 0',
                borderBottom: '1px solid rgba(239, 239, 234, 0.5)'
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleChecklistItem(opt)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--accent-gold)',
                  cursor: 'pointer'
                }}
              />
              {opt}
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '16px 16px 120px 16px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      
      {/* Header Visual Style */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', fontWeight: 400, color: 'var(--text-primary)' }}>
          Laudo de Consumo
        </h1>
        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
          Perícia de Consumo (Energia)
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SECTION 1: Dados Gerais */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--accent-gold)' }}>
            <User size={18} /> Dados Gerais
          </h2>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nome do Autor *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ex: João da Silva" 
              value={nomeAutor}
              onChange={(e) => setNomeAutor(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Número do Processo</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ex: 0001234-56.2026.8.19.0001" 
              value={numeroProcesso}
              onChange={(e) => setNumeroProcesso(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Réu / Concessionária</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ex: Light / Enel" 
              value={reuConcessionaria}
              onChange={(e) => setReuConcessionaria(e.target.value)}
            />
          </div>

          {renderRadio(
            'Tipo de ação *',
            tipoAcao,
            setTipoAcao,
            ['Consumo', 'TOI', 'Outro'],
            <Zap size={14} style={{ color: 'var(--accent-gold)' }} />
          )}
        </section>

        {/* SECTION 2: Dados da Vistoria */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--accent-gold)' }}>
            <Calendar size={18} /> Dados da Vistoria
          </h2>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Data da Vistoria *</label>
            <input 
              type="date" 
              className="form-control" 
              value={dataVistoria}
              onChange={(e) => setDataVistoria(e.target.value)}
              required
            />
          </div>

          {renderSelect(
            'Nº da Vistoria *',
            numeroVistoria,
            setNumeroVistoria,
            ['1', '2', '3', '4', '5', '6', '7', '8'],
            <ClipboardList size={14} style={{ color: 'var(--accent-gold)' }} />
          )}

          {renderRadio(
            'Período da Vistoria',
            periodoVistoria,
            setPeriodoVistoria,
            ['Manhã 09 - 12 h', 'Tarde 13 - 17 h'],
            <Calendar size={14} style={{ color: 'var(--accent-gold)' }} />
          )}
        </section>

        {/* SECTION 3: Presença das Partes */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--accent-gold)' }}>
            <Users size={18} /> Presença das Partes
          </h2>

          {renderRadio(
            'Representação do Autor presente? *',
            representacaoAutor,
            setRepresentacaoAutor,
            ['Sim', 'Não (Sem justificativa)', 'Não (Problema na Agenda)', 'Outro'],
            <User size={14} style={{ color: 'var(--accent-gold)' }} />
          )}

          {renderRadio(
            'Representação do Réu presente? *',
            representacaoReu,
            setRepresentacaoReu,
            ['Sim', 'Não (Sem justificativa)', 'Não (Problema na Agenda)', 'Outro'],
            <User size={14} style={{ color: 'var(--accent-gold)' }} />
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Observações sobre presença das partes</label>
            <textarea 
              className="form-control" 
              rows={3} 
              placeholder="Descreva detalhes adicionais sobre a presença das partes..." 
              value={observacoesPresenca}
              onChange={(e) => setObservacoesPresenca(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </section>

        {/* SECTION 4: Medidor */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--accent-gold)' }}>
            <Zap size={18} /> Detalhes do Medidor
          </h2>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Número do Medidor</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ex: NC 1320 42 86" 
              value={numeroMedidor}
              onChange={(e) => setNumeroMedidor(e.target.value)}
            />
          </div>

          {renderRadio(
            'Medidor possui chip/smart card?',
            medidorChip,
            setMedidorChip,
            ['Sim', 'Não', 'Não foi possível verificar', 'Outro'],
            <Zap size={14} style={{ color: 'var(--accent-gold)' }} />
          )}

          {renderRadio(
            'Condições visuais do medidor',
            condicoesMedidor,
            setCondicoesMedidor,
            ['Boa (Lacrado)', 'Violado (Não lacrado)', 'Outro'],
            <Zap size={14} style={{ color: 'var(--accent-gold)' }} />
          )}

          {renderRadio(
            'Houve Corte de Energia?',
            corteEnergia,
            setCorteEnergia,
            ['Sim', 'Não', 'Outro'],
            <Zap size={14} style={{ color: 'var(--accent-gold)' }} />
          )}
        </section>

        {/* SECTION 5: Características da UC */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--accent-gold)' }}>
            <Home size={18} /> Unidade Consumidora
          </h2>

          {renderSelect(
            'Quantidade de pessoas residentes',
            qtdPessoas,
            setQtdPessoas,
            ['1', '2', '3', '4', '5', '6', '7', '8'],
            <Users size={14} style={{ color: 'var(--accent-gold)' }} />
          )}

          {renderSelect(
            'Quantidade de cômodos',
            qtdComodos,
            setQtdComodos,
            ['1', '2', '3', '4', '5', '6', '7', '8'],
            <Home size={14} style={{ color: 'var(--accent-gold)' }} />
          )}
        </section>

        {/* SECTION 6: Eletrodomésticos */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--accent-gold)' }}>
            <Tv size={18} /> Aparelhos e Eletrodomésticos
          </h2>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nº de Lâmpadas</label>
            <input 
              type="number" 
              className="form-control" 
              placeholder="Ex: 12" 
              value={numLampadas}
              onChange={(e) => setNumLampadas(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            {renderSelect('Nº de TVs', numTvs, setNumTvs, ['0', '1', '2', '3', '4', '5', '6', '7', '8'])}
            {renderSelect('Nº de Ventiladores', numVentiladores, setNumVentiladores, ['0', '1', '2', '3', '4', '5', '6', '7', '8'])}
          </div>

          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            {renderSelect('Ventiladores Teto', numVentiladoresTeto, setNumVentiladoresTeto, ['0', '1', '2', '3', '4', '5', '6', '7', '8'])}
            {renderSelect('Ar Condicionado', numArCondicionados, setNumArCondicionados, ['0', '1', '2', '3', '4', '5', '6', '7', '8'])}
          </div>

          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            {renderSelect('Nº de Geladeiras', numGeladeiras, setNumGeladeiras, ['0', '1', '2', '3', '4', '5', '6', '7', '8'])}
            {renderSelect('Chuveiros Elétricos', numChuveiros, setNumChuveiros, ['0', '1', '2', '3', '4', '5', '6', '7', '8'])}
          </div>

          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            {renderSelect('Maq. Lavar Roupa', numMaquinasLavar, setNumMaquinasLavar, ['0', '1', '2', '3', '4', '5', '6', '7', '8'])}
            {renderSelect('Nº de Freezers', numFreezers, setNumFreezers, ['0', '1', '2', '3', '4', '5', '6', '7', '8'])}
          </div>
        </section>

        {/* SECTION 7: Checklist Técnico & Fotos */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--accent-gold)' }}>
            <CheckSquare size={18} /> Checklist & Evidências
          </h2>

          {renderChecklist(
            'Checklist Técnico',
            checklist,
            ['Fotos da fachada do Imóvel', 'Fotos dos Eletrodomésticos', 'Foto das Contas de Luz', 'Foto do Medidor', 'Foto do Chip'],
            <CheckSquare size={14} style={{ color: 'var(--accent-gold)' }} />
          )}

          {/* Hidden inputs for uploads */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            style={{ display: 'none' }} 
            ref={cameraImovelRef}
            onChange={(e) => handlePhotoChange(e, 'imovel')}
          />
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            style={{ display: 'none' }} 
            ref={galleryImovelRef}
            onChange={(e) => handlePhotoChange(e, 'imovel')}
          />
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            style={{ display: 'none' }} 
            ref={cameraMedidorRef}
            onChange={(e) => handlePhotoChange(e, 'medidor')}
          />
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            style={{ display: 'none' }} 
            ref={galleryMedidorRef}
            onChange={(e) => handlePhotoChange(e, 'medidor')}
          />

          {/* Loading Photos Overlay */}
          {isLoadingPhotos && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', backgroundColor: 'var(--accent-gold-light)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-gold-hover)', fontSize: '0.85rem' }}>
              <Loader2 size={16} className="spin" />
              Processando fotos de alta resolução...
            </div>
          )}

          {/* 7.1: Fotos do Imóvel */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <span className="form-label" style={{ fontWeight: 600, marginBottom: '8px' }}>
              Fotos do Imóvel ({photosImovel.length})
            </span>
            <div className="grid grid-cols-2" style={{ gap: '12px', marginBottom: '12px' }}>
              <button 
                type="button" 
                className="btn btn-gold" 
                onClick={() => cameraImovelRef.current?.click()}
                disabled={isLoadingPhotos}
              >
                <Camera size={18} /> Tirar Foto
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => galleryImovelRef.current?.click()}
                disabled={isLoadingPhotos}
              >
                <ImageIcon size={18} /> Galeria
              </button>
            </div>

            {photosImovel.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                gap: '8px', 
                maxHeight: '200px', 
                overflowY: 'auto',
                padding: '4px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-primary)'
              }}>
                {photosImovel.map((photo) => (
                  <div key={photo.id} className="photo-grid-item">
                    <img 
                      src={photo.thumbnail} 
                      alt={photo.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id, 'imovel')}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        backgroundColor: 'rgba(184, 120, 120, 0.9)',
                        border: 'none',
                        borderRadius: '4px',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7.2: Fotos do Medidor */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <span className="form-label" style={{ fontWeight: 600, marginBottom: '8px' }}>
              Fotos do Medidor ({photosMedidor.length})
            </span>
            <div className="grid grid-cols-2" style={{ gap: '12px', marginBottom: '12px' }}>
              <button 
                type="button" 
                className="btn btn-gold" 
                onClick={() => cameraMedidorRef.current?.click()}
                disabled={isLoadingPhotos}
              >
                <Camera size={18} /> Tirar Foto
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => galleryMedidorRef.current?.click()}
                disabled={isLoadingPhotos}
              >
                <ImageIcon size={18} /> Galeria
              </button>
            </div>

            {photosMedidor.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                gap: '8px', 
                maxHeight: '200px', 
                overflowY: 'auto',
                padding: '4px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-primary)'
              }}>
                {photosMedidor.map((photo) => (
                  <div key={photo.id} className="photo-grid-item">
                    <img 
                      src={photo.thumbnail} 
                      alt={photo.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id, 'medidor')}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        backgroundColor: 'rgba(184, 120, 120, 0.9)',
                        border: 'none',
                        borderRadius: '4px',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {draftSavedAt && (
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontStyle: 'italic', textAlign: 'right', marginTop: '4px' }}>
              {draftSavedAt}
            </div>
          )}
        </section>

        {/* SECTION 8: Observações Finais */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--accent-gold)' }}>
            <FileText size={18} /> Observações Finais
          </h2>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Observações Técnicas do Perito</label>
            <textarea 
              className="form-control" 
              rows={4} 
              placeholder="Descreva observações técnicas observadas durante a vistoria..." 
              value={observacoesFinais}
              onChange={(e) => setObservacoesFinais(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </section>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: 'var(--accent-rust-light)', color: 'var(--accent-rust)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
            <Trash2 size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
        >
          <Save size={18} />
          Salvar Laudo ({photosImovel.length + photosMedidor.length} fotos)
        </button>
      </form>

      {/* Success Animation Modal */}
      {showSuccessModal && (
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
          <div className="card fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '32px' }}>
            <CheckCircle size={48} style={{ color: 'var(--accent-sage)', marginBottom: '16px', marginInline: 'auto' }} />
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>Salvo com Sucesso!</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '24px' }}>
              A vistoria foi arquivada localmente no celular. {isOnline ? 'O envio para a automação começará em seguida!' : 'Ela será enviada automaticamente assim que tiver sinal de internet.'}
            </p>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => setShowSuccessModal(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
