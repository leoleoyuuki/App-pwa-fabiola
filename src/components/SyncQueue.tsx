import React, { useState, useEffect, useRef } from 'react';
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
  Database,
  DownloadCloud,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { auth } from '../utils/firebase';
import { downloadAppForOffline, getOfflineStatus } from '../utils/offlineManager';
import { parseSyncError } from '../utils/diagnosticHelper';
import type { DiagnosticInfo } from '../utils/diagnosticHelper';

interface SyncQueueProps {
  queue: InspectionData[];
  history: HistoryItem[];
  refreshData: () => void;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  isOnline: boolean;
  userEmail?: string;
}

export const SyncQueue: React.FC<SyncQueueProps> = ({
  queue,
  history,
  refreshData,
  webhookUrl,
  setWebhookUrl,
  isOnline,
  userEmail
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingWebhook, setIsEditingWebhook] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentSyncId, setCurrentSyncId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Diagnostic states
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Offline pre-cache states
  const [offlineStatus, setOfflineStatus] = useState(getOfflineStatus);
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [offlineProgressMsg, setOfflineProgressMsg] = useState('');
  const [offlineProgressPct, setOfflineProgressPct] = useState(0);

  // Synchronous ref to prevent double-execution
  const isSyncingRef = useRef(false);
  const inFlightIdsRef = useRef<Set<string>>(new Set());

  // Auto-sync when transitioning from offline to online
  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    // Only auto-sync when online status changes from false -> true
    if (!prevOnlineRef.current && isOnline && queue.length > 0 && !isSyncingRef.current) {
      handleSyncAll();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  const handleSyncAll = async () => {
    if (queue.length === 0 || isSyncingRef.current) return;
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      setErrorMsg('Configure uma URL de Webhook válida nas configurações antes de sincronizar.');
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    setErrorMsg(null);
    setDiagnostic(null);
    setSuccessMsg(null);

    let hasError = false;

    // Sync items one by one (FIFO)
    for (const inspection of queue) {
      // Prevent duplicate syncing of the exact same inspection ID
      if (inFlightIdsRef.current.has(inspection.id)) {
        continue;
      }

      inFlightIdsRef.current.add(inspection.id);
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
        hasError = true;
        const diag = parseSyncError(
          err,
          inspection.nomeAutor,
          inspection.photosImovel.length + inspection.photosMedidor.length,
          inspection.numeroProcesso
        );
        setDiagnostic(diag);
        setErrorMsg(`Falha ao enviar "${inspection.nomeAutor}": ${err.message || err}`);
        break; // Stop sync queue on error
      } finally {
        inFlightIdsRef.current.delete(inspection.id);
      }
    }

    setIsSyncing(false);
    isSyncingRef.current = false;
    setCurrentSyncId(null);
    setSyncProgress(null);
    
    if (!hasError) {
      setSuccessMsg('Sincronização concluída com sucesso!');
    }
  };

  const handleDownloadOffline = async () => {
    setIsDownloadingOffline(true);
    setOfflineProgressMsg('Iniciando download...');
    setOfflineProgressPct(0);

    const result = await downloadAppForOffline(webhookUrl, (msg, pct) => {
      setOfflineProgressMsg(msg);
      setOfflineProgressPct(pct);
    }, userEmail);

    setIsDownloadingOffline(false);
    setOfflineStatus(getOfflineStatus());

    if (result.success) {
      setSuccessMsg(`✅ ${result.message} (${result.fileCount} recursos em cache)`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(result.message);
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
            {/* User Session Info & Sign Out */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Logado como:</span>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{auth.currentUser?.email || 'Usuário offline'}</div>
              </div>
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: '8px 12px', textTransform: 'none', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                onClick={() => auth.signOut()}
              >
                Sair da Conta
              </button>
            </div>

            <div style={{ borderTop: '1px solid rgba(239, 239, 234, 0.5)', paddingTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={isEditingWebhook} 
                  onChange={(e) => setIsEditingWebhook(e.target.checked)}
                  style={{ accentColor: 'var(--accent-gold)' }}
                />
                Alterar URL do Webhook (Avançado)
              </label>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">URL do Webhook (Google Apps Script)</label>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder="https://script.google.com/..." 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  disabled={!isEditingWebhook}
                  style={{ fontSize: '0.85rem', color: isEditingWebhook ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                />
              </div>

              {isEditingWebhook && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.75rem', marginTop: '6px', width: '100%', textTransform: 'none' }}
                  onClick={() => {
                    const defaultUrl = 'https://script.google.com/macros/s/AKfycbyZJM6rSwBr3BKD_LawYeeRUoynUhQIol4GILJnnCYiMCCzD4B2-JfXFjJCwe2rC4Q5/exec';
                    setWebhookUrl(defaultUrl);
                    setIsEditingWebhook(false);
                  }}
                >
                  Restaurar URL Padrão
                </button>
              )}
            </div>

            {/* Offline Pre-cache Control inside Settings */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(239, 239, 234, 0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DownloadCloud size={18} style={{ color: 'var(--accent-gold)' }} />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Pre-Cache para Uso em Campo
                    </span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {offlineStatus.isReady 
                        ? `Último download: ${offlineStatus.lastDownloadedAt}` 
                        : 'Baixe arquivos e agenda para navegar sem sinal'}
                    </p>
                  </div>
                </div>
                {offlineStatus.isReady && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-sage)', fontWeight: 600, backgroundColor: 'var(--accent-sage-light)', padding: '2px 8px', borderRadius: '12px' }}>
                    Pronto
                  </span>
                )}
              </div>

              {isDownloadingOffline ? (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>{offlineProgressMsg}</span>
                    <span>{offlineProgressPct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${offlineProgressPct}%`, height: '100%', backgroundColor: 'var(--accent-gold)', transition: 'width 0.2s ease' }} />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleDownloadOffline}
                  disabled={isDownloadingOffline || !isOnline}
                  style={{ width: '100%', marginTop: '8px', fontSize: '0.75rem', height: '34px', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', textTransform: 'none' }}
                >
                  <DownloadCloud size={14} />
                  {offlineStatus.isReady ? 'Atualizar Cache Offline' : 'Baixar Aplicativo para Uso Offline'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Offline Quick Badge / Precache Trigger when Offline Ready status is displayed */}
        {!showSettings && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '10px 14px', 
            backgroundColor: offlineStatus.isReady ? 'var(--accent-sage-light)' : 'var(--accent-gold-light)', 
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${offlineStatus.isReady ? 'rgba(143, 151, 121, 0.4)' : 'var(--accent-gold)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DownloadCloud size={16} style={{ color: offlineStatus.isReady ? 'var(--accent-sage)' : 'var(--accent-gold)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {offlineStatus.isReady ? 'Modo Offline: 100% Pronto' : 'Baixar Modo Offline'}
                </span>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {offlineStatus.isReady ? `Atualizado em ${offlineStatus.lastDownloadedAt}` : 'Toque para salvar o app e usar sem sinal'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownloadOffline}
              disabled={isDownloadingOffline || !isOnline}
              style={{ 
                padding: '4px 10px', 
                fontSize: '0.7rem', 
                height: '28px', 
                textTransform: 'none', 
                borderRadius: 'var(--radius-xs)',
                flexShrink: 0
              }}
            >
              {isDownloadingOffline ? <Loader2 size={12} className="spin" /> : offlineStatus.isReady ? 'Atualizar' : 'Baixar'}
            </button>
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
                Enviando relatório: {queue.find(item => item.id === currentSyncId)?.nomeAutor}...
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

        {/* Rich Error Diagnostic Card */}
        {diagnostic ? (
          <div 
            className="fade-in" 
            style={{ 
              backgroundColor: 'var(--accent-rust-light)', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid rgba(184, 120, 120, 0.4)',
              padding: '16px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertCircle size={18} style={{ color: 'var(--accent-rust)', flexShrink: 0 }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-rust)', margin: 0 }}>
                {diagnostic.title}
              </h4>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.4' }}>
              <strong>Motivo:</strong> {diagnostic.cause}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4', backgroundColor: 'rgba(255,255,255,0.6)', padding: '8px', borderRadius: '4px' }}>
              💡 <strong>O que fazer:</strong> {diagnostic.recommendation}
            </div>

            {/* Action buttons: Copy Diagnostic for WhatsApp */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(diagnostic.technicalDetails);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 3000);
                }}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '0.75rem', 
                  height: '32px', 
                  borderRadius: 'var(--radius-xs)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  backgroundColor: isCopied ? 'var(--accent-sage-light)' : '#fff',
                  color: isCopied ? 'var(--accent-sage)' : 'var(--text-primary)',
                  borderColor: isCopied ? 'var(--accent-sage)' : 'var(--border-color)',
                  textTransform: 'none'
                }}
              >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                {isCopied ? 'Copiado para o WhatsApp!' : 'Copiar Diagnóstico para Suporte'}
              </button>

              <button
                type="button"
                onClick={() => setShowTechDetails(!showTechDetails)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer', 
                  textDecoration: 'underline',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0 6px'
                }}
              >
                {showTechDetails ? 'Ocultar detalhes' : 'Ver erro técnico'}
                {showTechDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {/* Expandable Technical Log */}
            {showTechDetails && (
              <pre style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: 'rgba(0, 0, 0, 0.05)', 
                borderRadius: '4px', 
                fontSize: '0.7rem', 
                color: 'var(--text-secondary)', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {diagnostic.technicalDetails}
              </pre>
            )}
          </div>
        ) : errorMsg ? (
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
        ) : null}

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
                  {item.nomeAutor || 'Autor sem nome'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Processo: {item.numeroProcesso || 'Não especificado'}
                </p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>📷 {item.photosImovel.length + item.photosMedidor.length} Fotos</span>
                  <span>📅 {new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Remove item from queue button */}
              <button 
                onClick={() => handleRemoveItem(item.id, item.nomeAutor)}
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
