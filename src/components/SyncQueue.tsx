import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import type { InspectionData, HistoryItem } from '../utils/db';
import { syncInspection } from '../utils/syncService';
import type { SyncProgress } from '../utils/syncService';
import { 
  Wifi, 
  WifiOff, 
  Settings, 
  Send, 
  History, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Database
} from 'lucide-react';

interface SyncQueueProps {
  queue: InspectionData[];
  history: HistoryItem[];
  refreshData: () => void;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  isOnline: boolean;
}

export const SyncQueue: React.FC<SyncQueueProps> = ({
  queue,
  history,
  refreshData,
  webhookUrl,
  setWebhookUrl,
  isOnline
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentSyncId, setCurrentSyncId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-sync when online if queue has items
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      // Prompt user or start auto-sync
      // For safety, we can auto-trigger it or let them tap. Let's do auto-sync for a seamless UX!
      handleSyncAll();
    }
  }, [isOnline, queue.length]);

  const handleSyncAll = async () => {
    if (queue.length === 0 || isSyncing) return;
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      setErrorMsg('Configure uma URL de Webhook válida nas configurações antes de sincronizar.');
      return;
    }

    setIsSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Sync items one by one (FIFO)
    for (const inspection of queue) {
      setCurrentSyncId(inspection.id);
      setSyncProgress({ loaded: 0, total: 0, percentage: 0 });

      try {
        await syncInspection(inspection, webhookUrl, (progress) => {
          setSyncProgress(progress);
        });

        // Add to history (metadata only)
        await db.addToHistory(inspection);
        // Remove from queue
        await db.removeFromQueue(inspection.id);
        
        refreshData();
      } catch (err: any) {
        setErrorMsg(`Falha ao enviar "${inspection.clientName}": ${err.message || err}`);
        break; // Stop sync queue on error
      }
    }

    setIsSyncing(false);
    setCurrentSyncId(null);
    setSyncProgress(null);
    
    if (!errorMsg) {
      setSuccessMsg('Sincronização concluída com sucesso!');
    }
  };

  const handleRemoveItem = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja apagar a inspeção de "${name}" da fila? Ela não foi enviada ainda.`)) {
      await db.removeFromQueue(id);
      refreshData();
    }
  };

  // Convert bytes to readable formats
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="fade-in" style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      {/* Network Status Banner */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '20px',
          backgroundColor: isOnline ? 'var(--accent-sage-light)' : 'var(--accent-rust-light)',
          color: isOnline ? 'var(--accent-sage)' : 'var(--accent-rust)',
          border: `1px solid ${isOnline ? 'rgba(143, 151, 121, 0.3)' : 'rgba(184, 120, 120, 0.3)'}`
        }}
      >
        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span>{isOnline ? 'Conexão Restaurada - Online' : 'Modo Offline - Salvando Localmente'}</span>
      </div>

      {/* Sync Control Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>Sincronização</h2>
            <p style={{ fontSize: '0.8rem' }}>Envia os relatórios para a sua automação</p>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '8px 12px' }}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Webhook Configuration Expandable Panel */}
        {showSettings && (
          <div className="fade-in" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">URL do Webhook (Make / Zapier)</label>
              <input 
                type="url" 
                className="form-control" 
                placeholder="https://hook.us1.make.com/..." 
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Insira a URL que recebe a requisição POST (multipart/form-data) com os dados e fotos originais.
            </p>
          </div>
        )}

        {/* Sync Progress Indicator */}
        {isSyncing && syncProgress && (
          <div 
            className="glass-panel" 
            style={{ 
              padding: '16px', 
              borderRadius: 'var(--radius-sm)', 
              marginBottom: '16px',
              border: '1px solid var(--accent-gold)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Loader2 size={16} className="spin" style={{ color: 'var(--accent-gold)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                Enviando relatório: {queue.find(item => item.id === currentSyncId)?.clientName}...
              </span>
            </div>
            
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div 
                style={{ 
                  width: `${syncProgress.percentage}%`, 
                  height: '100%', 
                  backgroundColor: 'var(--accent-gold)',
                  transition: 'width 0.1s linear'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>{syncProgress.percentage}% concluído</span>
              {syncProgress.total > 0 && (
                <span>
                  {formatBytes(syncProgress.loaded)} / {formatBytes(syncProgress.total)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Notifications */}
        {errorMsg && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            padding: '12px', 
            backgroundColor: 'var(--accent-rust-light)', 
            color: 'var(--accent-rust)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '16px',
            alignItems: 'flex-start'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            padding: '12px', 
            backgroundColor: 'var(--accent-sage-light)', 
            color: 'var(--accent-sage)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '16px',
            alignItems: 'center'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sync trigger button */}
        <button 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          onClick={handleSyncAll}
          disabled={queue.length === 0 || isSyncing}
        >
          {isSyncing ? (
            <>
              <Loader2 size={16} className="spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Send size={16} />
              Sincronizar Fila ({queue.length})
            </>
          )}
        </button>
      </div>

      {/* Queue List (Pending) */}
      <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
        <Database size={14} /> Fila de Espera ({queue.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.85rem', color: '#B4B6B8' }}>Nenhuma inspeção aguardando envio.</p>
          </div>
        ) : (
          queue.map((item) => (
            <div key={item.id} className="card" style={{ padding: '16px', position: 'relative' }}>
              <div style={{ paddingRight: '40px' }}>
                <h4 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
                  {item.clientName || 'Cliente sem nome'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Local: {item.projectAddress || 'Não especificado'}
                </p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>📷 {item.photos.length} Fotos</span>
                  <span>📅 {new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Remove item from queue button */}
              <button 
                onClick={() => handleRemoveItem(item.id, item.clientName)}
                disabled={isSyncing}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--accent-rust)',
                  opacity: 0.7,
                  padding: '4px'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Sync History */}
      <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
        <History size={14} /> Histórico de Envios
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.85rem', color: '#B4B6B8' }}>Nenhum relatório enviado ainda.</p>
          </div>
        ) : (
          history.slice(0, 10).map((item) => (
            <div 
              key={item.id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px 16px', 
                borderBottom: '1px solid var(--border-color)' 
              }}
            >
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 500, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
                  {item.clientName}
                </h4>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>{item.photoCount} fotos</span>
                  <span>•</span>
                  <span>Enviado: {new Date(item.syncedAt).toLocaleDateString('pt-BR')} às {new Date(item.syncedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <CheckCircle2 size={16} style={{ color: 'var(--accent-sage)', flexShrink: 0 }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
