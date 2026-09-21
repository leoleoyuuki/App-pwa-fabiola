import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import type { DraftData, HistoryItem } from '../utils/db';
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
  AlertCircle,
  History,
  RotateCcw
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
  const [activeSubTab, setActiveSubTab] = useState<'drafts' | 'history'>('drafts');
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dList, hList] = await Promise.all([
        db.getAllDrafts(userEmail),
        db.getHistory(userEmail)
      ]);
      setDrafts(dList);
      setHistoryItems(hList);
    } catch (err) {
      console.error('Erro ao carregar dados de rascunhos e histórico:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const handleResumeFromHistory = (item: HistoryItem) => {
    const full = item.fullData;
    const draft: DraftData = {
      id: `draft_resume_${Date.now()}`,
      nomeAutor: full?.nomeAutor || item.clientName || '',
      numeroProcesso: full?.numeroProcesso || (item.projectAddress !== 'S/N' ? item.projectAddress : '') || '',
      reuConcessionaria: full?.reuConcessionaria || '',
      tipoAcao: full?.tipoAcao || item.inspectorName || 'Consumo',
      dataVistoria: full?.dataVistoria || '',
      numeroVistoria: full?.numeroVistoria || '1',
      periodoVistoria: full?.periodoVistoria || 'Manhã 09 - 12 h',
      representacaoAutor: full?.representacaoAutor || 'Sim',
      representacaoReu: full?.representacaoReu || 'Sim',
      observacoesPresenca: full?.observacoesPresenca || '',
      numeroMedidor: full?.numeroMedidor || '',
      medidorChip: full?.medidorChip || 'Não',
      condicoesMedidor: full?.condicoesMedidor || 'Boa (Lacrado)',
      corteEnergia: full?.corteEnergia || 'Não',
      notificacaoPreviaCorte: full?.notificacaoPreviaCorte || 'Não',
      observacoesMedidor: full?.observacoesMedidor || '',
      qtdPessoas: full?.qtdPessoas || '1',
      qtdComodos: full?.qtdComodos || '1',
      numLampadas: full?.numLampadas || '',
      numTvs: full?.numTvs || '0',
      numVentiladores: full?.numVentiladores || '0',
      numVentiladoresTeto: full?.numVentiladoresTeto || '0',
      numArCondicionados: full?.numArCondicionados || '0',
      numGeladeiras: full?.numGeladeiras || '0',
      numChuveiros: full?.numChuveiros || '0',
      numMaquinasLavar: full?.numMaquinasLavar || '0',
      numFreezers: full?.numFreezers || '0',
      checklist: full?.checklist || [],
      observacoesFinais: full?.observacoesFinais || '',
      photosImovel: full?.photosImovel || [],
      photosMedidor: full?.photosMedidor || [],
      updatedAt: new Date().toISOString()
    };
    onSelectDraft(draft);
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
    <div className="container fade-in" style={{ padding: '16px 16px 120px 16px', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileEdit size={22} style={{ color: 'var(--accent-gold)' }} />
            Vistorias & Rascunhos
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Gerencie rascunhos em andamento ou retome vistorias anteriores
          </p>
        </div>

        <button
          type="button"
          className="btn btn-gold"
          onClick={onNewInspection}
          style={{ fontSize: '0.82rem', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <PlusCircle size={16} />
          Nova Vistoria
        </button>
      </div>

      {/* Sub-tabs switch */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('drafts')}
          className={`btn ${activeSubTab === 'drafts' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <FileEdit size={15} />
          Rascunhos ({drafts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`btn ${activeSubTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <History size={15} />
          Enviadas no Aparelho ({historyItems.length})
        </button>
      </div>

      {/* Auto-save Info Banner */}
      <div style={{ 
        backgroundColor: 'var(--accent-gold-light)', 
        border: '1px solid var(--accent-gold)', 
        borderRadius: 'var(--radius-sm)', 
        padding: '10px 14px', 
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Sparkles size={18} style={{ color: 'var(--accent-gold-hover)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {activeSubTab === 'drafts' ? (
            <strong>Salvamento Automático:</strong>
          ) : (
            <strong>Memória Segura Offline:</strong>
          )} {activeSubTab === 'drafts' ? 'Qualquer alteração no formulário é salva automaticamente no seu dispositivo.' : 'Todas as vistorias enviadas ficam guardadas no celular para você poder retomar e reenviar quando precisar.'}
        </span>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
          Carregando dados...
        </div>
      ) : activeSubTab === 'drafts' ? (
        /* --- ABA RASCUNHOS --- */
        drafts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              color: 'var(--accent-gold)'
            }}>
              <FileEdit size={24} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Nenhum rascunho pendente
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto 16px auto' }}>
              Ao preencher os campos do laudo, um rascunho em tempo real será salvo aqui automaticamente.
            </p>
            <button
              type="button"
              className="btn btn-gold"
              onClick={onNewInspection}
              style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
            >
              <PlusCircle size={16} /> Iniciar Vistoria
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {drafts.map((draft) => {
              const totalPhotos = (draft.photosImovel?.length || 0) + (draft.photosMedidor?.length || 0);
              const isDeleting = deleteConfirmId === draft.id;

              return (
                <div 
                  key={draft.id} 
                  className="card"
                  onClick={() => onSelectDraft(draft)}
                  style={{ 
                    padding: '16px', 
                    cursor: 'pointer', 
                    transition: 'var(--transition)',
                    border: '1px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {draft.nomeAutor || 'Vistoria Sem Nome'}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>
                        {draft.numeroProcesso || 'Processo não informado'}
                      </div>
                    </div>

                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 600, 
                      textTransform: 'uppercase',
                      padding: '2px 8px', 
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap'
                    }}>
                      {draft.tipoAcao || 'Consumo'}
                    </span>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '6px', 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    padding: '8px 0',
                    borderTop: '1px solid var(--border-color)',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} style={{ color: 'var(--accent-gold)' }} />
                      <span>{draft.dataVistoria ? draft.dataVistoria : 'Data não def.'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Camera size={13} style={{ color: 'var(--accent-gold)' }} />
                      <span>{totalPhotos} {totalPhotos === 1 ? 'foto' : 'fotos'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Zap size={13} style={{ color: 'var(--accent-gold)' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Medidor: {draft.numeroMedidor || 'S/N'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={13} style={{ color: 'var(--accent-gold)' }} />
                      <span>{formatDate(draft.updatedAt)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isDeleting ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#C0392B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} /> Confirmar?
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(draft.id, e)}
                          style={{ backgroundColor: '#C0392B', color: '#FFF', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(draft.id); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', padding: '4px 6px' }}
                        title="Excluir este rascunho"
                      >
                        <Trash2 size={13} /> Excluir
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-gold"
                      onClick={() => onSelectDraft(draft)}
                      style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      Continuar Vistoria <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* --- ABA HISTÓRICO LOCAL DE VISTORIAS ENVIADAS --- */
        historyItems.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              color: 'var(--accent-gold)'
            }}>
              <History size={24} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Nenhuma vistoria arquivada no aparelho
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto 16px auto' }}>
              Conforme você envia vistorias, uma cópia segura de recuperação é guardada no aparelho para permitir retomar quando necessário.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historyItems.map((item) => {
              const full = item.fullData;
              const dateDisplay = full?.dataVistoria || item.createdAt;

              return (
                <div 
                  key={item.id} 
                  className="card"
                  style={{ 
                    padding: '16px', 
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {item.clientName || full?.nomeAutor || 'Autor'}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>
                        {item.projectAddress && item.projectAddress !== 'S/N' ? item.projectAddress : (full?.numeroProcesso || 'Processo')}
                      </div>
                    </div>

                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 600, 
                      textTransform: 'uppercase',
                      padding: '2px 8px', 
                      borderRadius: '10px',
                      backgroundColor: 'var(--accent-gold-light)',
                      border: '1px solid var(--accent-gold)',
                      color: 'var(--accent-gold-hover)',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.inspectorName || full?.tipoAcao || 'Consumo'}
                    </span>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '6px', 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    padding: '8px 0',
                    borderTop: '1px solid var(--border-color)',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} style={{ color: 'var(--accent-gold)' }} />
                      <span>Vistoria: {dateDisplay}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Camera size={13} style={{ color: 'var(--accent-gold)' }} />
                      <span>{item.photoCount} fotos salvas</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', gridColumn: 'span 2' }}>
                      <Clock size={13} style={{ color: 'var(--accent-gold)' }} />
                      <span>Enviado: {formatDate(item.syncedAt || item.createdAt)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-gold"
                      onClick={() => handleResumeFromHistory(item)}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '6px 14px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px' 
                      }}
                      title="Recupera todos os dados desta vistoria para editar fotos e reenviar"
                    >
                      <RotateCcw size={14} /> Retomar Vistoria
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

    </div>
  );
};
