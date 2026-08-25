import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import type { DraftData } from '../utils/db';
import { 
  FileEdit, 
  Trash2, 
  ArrowRight, 
  PlusCircle, 
  Camera, 
  Calendar, 
  Zap, 
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface DraftsListProps {
  userEmail?: string;
  onSelectDraft: (draft: DraftData) => void;
  onNewInspection: () => void;
}

export const DraftsList: React.FC<DraftsListProps> = ({
  userEmail,
  onSelectDraft,
  onNewInspection
}) => {
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadDrafts = async () => {
    setIsLoading(true);
    try {
      const list = await db.getAllDrafts(userEmail);
      setDrafts(list);
    } catch (err) {
      console.error('Erro ao carregar rascunhos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, [userEmail]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await db.deleteDraft(id, userEmail);
      setDrafts(prev => prev.filter(d => d.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Erro ao excluir rascunho:', err);
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="container fade-in" style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileEdit size={22} style={{ color: 'var(--accent-gold)' }} />
            Rascunhos Salvos
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {drafts.length} {drafts.length === 1 ? 'vistoria em andamento' : 'vistorias em andamento'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-gold"
          onClick={onNewInspection}
          style={{ fontSize: '0.82rem', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <PlusCircle size={16} />
          Nova Vistoria
        </button>
      </div>

      {/* Auto-save Info Banner */}
      <div style={{ 
        backgroundColor: 'var(--accent-gold-light)', 
        border: '1px solid var(--accent-gold)', 
        borderRadius: 'var(--radius-sm)', 
        padding: '12px 14px', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Sparkles size={18} style={{ color: 'var(--accent-gold-hover)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
          <strong>Salvamento Automático:</strong> Qualquer alteração no formulário é salva no seu dispositivo para você nunca perder dados.
        </span>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
          Carregando rascunhos...
        </div>
      ) : drafts.length === 0 ? (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: 'var(--accent-gold)'
          }}>
            <FileEdit size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Nenhum rascunho pendente
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto 20px auto' }}>
            Ao preencher qualquer campo no formulário de inspeção, o app criará um rascunho automático aqui.
          </p>
          <button
            type="button"
            className="btn btn-gold"
            onClick={onNewInspection}
            style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <PlusCircle size={18} /> Iniciar Vistoria
          </button>
        </div>
      ) : (
        /* Drafts List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {drafts.map((draft) => {
            const totalPhotos = (draft.photosImovel?.length || 0) + (draft.photosMedidor?.length || 0);
            const isDeleting = deleteConfirmId === draft.id;

            return (
              <div 
                key={draft.id} 
                className="card"
                onClick={() => onSelectDraft(draft)}
                style={{ 
                  padding: '18px', 
                  cursor: 'pointer', 
                  transition: 'var(--transition)',
                  border: '1px solid var(--border-color)',
                  position: 'relative'
                }}
              >
                {/* Header Row: Autor & Type */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {draft.nomeAutor || 'Vistoria Sem Nome'}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>
                      {draft.numeroProcesso || 'Processo não informado'}
                    </div>
                  </div>

                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 600, 
                    textTransform: 'uppercase',
                    padding: '3px 8px', 
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap'
                  }}>
                    {draft.tipoAcao || 'Consumo'}
                  </span>
                </div>

                {/* Details Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px', 
                  fontSize: '0.78rem', 
                  color: 'var(--text-secondary)',
                  padding: '10px 0',
                  borderTop: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} style={{ color: 'var(--accent-gold)' }} />
                    <span>{draft.dataVistoria ? draft.dataVistoria : 'Data não def.'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={13} style={{ color: 'var(--accent-gold)' }} />
                    <span>{totalPhotos} {totalPhotos === 1 ? 'foto anexada' : 'fotos anexadas'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={13} style={{ color: 'var(--accent-gold)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Medidor: {draft.numeroMedidor || 'Não inform.'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} style={{ color: 'var(--accent-gold)' }} />
                    <span>Salvo: {formatDate(draft.updatedAt)}</span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {isDeleting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#C0392B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={13} /> Confirmar exclusão?
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(draft.id, e)}
                        style={{
                          backgroundColor: '#C0392B',
                          color: '#FFF',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(draft.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}
                      title="Excluir este rascunho"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={() => onSelectDraft(draft)}
                    style={{ 
                      fontSize: '0.78rem', 
                      padding: '6px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px' 
                    }}
                  >
                    Retomar Vistoria <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
