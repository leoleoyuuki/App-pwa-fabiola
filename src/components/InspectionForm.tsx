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
  MapPin,
  ClipboardList
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
  const [clientName, setClientName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [stage, setStage] = useState('Marcenaria'); // Standard stages of interior design
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<PhotoData[]>([]);

  // State flags
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await db.getDraft();
        if (draft) {
          setClientName(draft.clientName || '');
          setProjectAddress(draft.projectAddress || '');
          setInspectorName(draft.inspectorName || '');
          setStage(draft.customFields?.stage || 'Marcenaria');
          setNotes(draft.notes || '');
          setPhotos(draft.photos || []);
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
      if (!clientName && !projectAddress && !inspectorName && !notes && photos.length === 0) {
        return;
      }
      try {
        await db.saveDraft({
          clientName,
          projectAddress,
          inspectorName,
          notes,
          photos,
          customFields: { stage }
        });
        const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setDraftSavedAt(`Salvo automaticamente às ${now}`);
      } catch (err) {
        console.error('Erro ao salvar rascunho:', err);
      }
    };

    // Simple debounce/defer to prevent writing on every keystroke
    const timer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timer);
  }, [clientName, projectAddress, inspectorName, stage, notes, photos]);

  // Handle Photo input (Camera and Gallery share this)
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoadingPhotos(true);
    setErrorMsg(null);

    const newPhotos: PhotoData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Generate a small base64 preview thumbnail (200x200px)
        const thumbnail = await generateThumbnail(file);

        // Keep the original high-resolution Blob intact
        newPhotos.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          original: file, // This is the high-res file
          thumbnail // This is the lightweight base64 string
        });
      } catch (err) {
        console.error('Erro ao processar foto:', err);
        setErrorMsg('Algumas fotos não puderam ser carregadas. Tente novamente.');
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setIsLoadingPhotos(false);

    // Reset inputs so the same files can be chosen again if needed
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Submit report to sync queue
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!clientName.trim()) {
      setErrorMsg('O nome do Cliente/Projeto é obrigatório.');
      return;
    }

    if (photos.length === 0) {
      setErrorMsg('Adicione pelo menos 1 foto da inspeção.');
      return;
    }

    const inspection: InspectionData = {
      id: `insp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      clientName: clientName.trim(),
      projectAddress: projectAddress.trim(),
      inspectorName: inspectorName.trim(),
      notes: notes.trim(),
      photos,
      customFields: { stage }
    };

    try {
      // Save report in queue
      await db.addToQueue(inspection);
      // Clear current draft
      await db.clearDraft();
      
      // Clear form states
      setClientName('');
      setProjectAddress('');
      setInspectorName('');
      setStage('Marcenaria');
      setNotes('');
      setPhotos([]);
      setDraftSavedAt(null);
      
      // Notify parent to refresh queue size
      onInspectionAdded();
      
      // Show elegant success animation modal
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Erro ao arquivar relatório:', err);
      setErrorMsg('Erro interno ao salvar relatório no celular.');
    }
  };

  return (
    <div className="fade-in" style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      
      {/* Header Visual Style */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', fontWeight: 400, color: 'var(--text-primary)' }}>
          Nova Inspeção
        </h1>
        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
          Registro de andamento de obra e acabamentos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Client Name Field */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} style={{ color: 'var(--accent-gold)' }} /> Cliente / Projeto
          </label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Ex: Apartamento Copacabana" 
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
        </div>

        {/* Address Field */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} style={{ color: 'var(--accent-gold)' }} /> Endereço / Local da Obra
          </label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Ex: Alameda Lorena, 1024 - Apto 82" 
            value={projectAddress}
            onChange={(e) => setProjectAddress(e.target.value)}
          />
        </div>

        {/* Responsive Grid for Inspector & Stage */}
        <div className="grid grid-cols-2" style={{ gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} style={{ color: 'var(--accent-gold)' }} /> Responsável
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Nome do Arquiteto" 
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ClipboardList size={14} style={{ color: 'var(--accent-gold)' }} /> Estágio Atual
            </label>
            <select 
              className="form-control" 
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'%231F2022\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '18px' }}
            >
              <option value="Estrutura / Alvenaria">Estrutura / Alvenaria</option>
              <option value="Gesso / Drywall">Gesso / Drywall</option>
              <option value="Revestimentos / Pisos">Revestimentos / Pisos</option>
              <option value="Pintura / Detalhes">Pintura / Detalhes</option>
              <option value="Marcenaria">Marcenaria</option>
              <option value="Iluminação">Iluminação</option>
              <option value="Decoração / Limpeza">Decoração / Limpeza</option>
            </select>
          </div>
        </div>

        {/* Observations Field */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ClipboardList size={14} style={{ color: 'var(--accent-gold)' }} /> Notas da Inspeção
          </label>
          <textarea 
            className="form-control" 
            rows={4} 
            placeholder="Descreva pendências, aprovações, atrasos ou notas de acabamento..." 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Photo Uploader Section */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="form-label" style={{ margin: 0, fontWeight: 600 }}>
              Fotos da Obra ({photos.length})
            </span>
            {draftSavedAt && (
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontStyle: 'italic' }}>
                {draftSavedAt}
              </span>
            )}
          </div>

          {/* Trigger Inputs Hidden */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            style={{ display: 'none' }} 
            ref={cameraInputRef}
            onChange={handlePhotoChange}
          />
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            style={{ display: 'none' }} 
            ref={galleryInputRef}
            onChange={handlePhotoChange}
          />

          {/* Styled Buttons Grid */}
          <div className="grid grid-cols-2" style={{ gap: '12px', marginBottom: '16px' }}>
            <button 
              type="button" 
              className="btn btn-gold" 
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoadingPhotos}
            >
              <Camera size={18} />
              Tirar Foto
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => galleryInputRef.current?.click()}
              disabled={isLoadingPhotos}
            >
              <ImageIcon size={18} />
              Da Galeria
            </button>
          </div>

          {/* Loading Photos Overlay */}
          {isLoadingPhotos && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', backgroundColor: 'var(--accent-gold-light)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-gold-hover)', fontSize: '0.85rem', marginBottom: '16px' }}>
              <Loader2 size={16} className="spin" />
              Processando fotos de alta resolução...
            </div>
          )}

          {/* Photo Thumbnail Grid */}
          {photos.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
              gap: '8px', 
              maxHeight: '280px', 
              overflowY: 'auto',
              padding: '4px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-primary)'
            }}>
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  style={{ 
                    position: 'relative', 
                    aspectRatio: '1', 
                    borderRadius: 'var(--radius-sm)', 
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  <img 
                    src={photo.thumbnail} 
                    alt={photo.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
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
          style={{ width: '100%', padding: '16px', fontSize: '1rem', marginTop: '8px' }}
        >
          <Save size={18} />
          Salvar Relatório ({photos.length} fotos)
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
              A inspeção foi arquivada localmente no celular. {isOnline ? 'O envio para a automação começará em seguida!' : 'Ela será enviada automaticamente assim que tiver sinal de internet.'}
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
