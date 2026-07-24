import { useState, useEffect } from 'react';
import { db } from './utils/db';
import type { InspectionData, HistoryItem } from './utils/db';
import { InspectionForm } from './components/InspectionForm';
import { SyncQueue } from './components/SyncQueue';
import { ClipboardList, Send, FileSpreadsheet } from 'lucide-react';
import { CloudHistory } from './components/CloudHistory';

function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'queue' | 'records'>('form');
  const [queue, setQueue] = useState<InspectionData[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Loading states
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [fadeClass, setFadeClass] = useState('');
  
  // Custom Webhook URL saved in localStorage
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('fabiola_webhook_url') || '';
  });

  // Persist Webhook URL when it changes
  useEffect(() => {
    localStorage.setItem('fabiola_webhook_url', webhookUrl);
  }, [webhookUrl]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch queue and history from IndexedDB
  const refreshData = async () => {
    try {
      const q = await db.getQueue();
      const h = await db.getHistory();
      setQueue(q);
      setHistory(h);
    } catch (err) {
      console.error('Erro ao ler do IndexedDB:', err);
    }
  };

  // Initial load with brand exposure duration
  useEffect(() => {
    const init = async () => {
      await refreshData();
      setTimeout(() => {
        setFadeClass('fade-out');
        setTimeout(() => {
          setIsAppLoading(false);
        }, 500); // Wait for CSS transition opacity to complete
      }, 1200); // 1.2s of elegant brand logo exposure
    };
    init();
  }, []);

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        paddingBottom: '105px' // Leave space for the floating bottom navbar
      }}
    >
      {/* Brand Loading Overlay */}
      {isAppLoading && (
        <div className={`loading-screen ${fadeClass}`}>
          <div className="loading-content">
            <img src="/logo192.png" className="loading-logo" alt="Logo" />
            <h2 className="loading-title">Fabiola</h2>
            <p className="loading-subtitle">Arquiteta & Designer</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      )}
      {/* Header Bar */}
      <header 
        className="glass-panel"
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span 
            style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: '1.4rem', 
              fontWeight: 500, 
              letterSpacing: '0.02em',
              color: 'var(--text-primary)'
            }}
          >
            Fabiola
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-secondary)',
                fontWeight: 400
              }}
            >
              Arquiteta & Designer
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'form' ? (
          <InspectionForm 
            onInspectionAdded={refreshData} 
            isOnline={isOnline}
          />
        ) : activeTab === 'records' ? (
          <CloudHistory 
            webhookUrl={webhookUrl}
            isOnline={isOnline}
          />
        ) : (
          <SyncQueue 
            queue={queue}
            history={history}
            refreshData={refreshData}
            webhookUrl={webhookUrl}
            setWebhookUrl={setWebhookUrl}
            isOnline={isOnline}
          />
        )}
      </main>

      {/* fixed bottom navigation bar (centered floating dock style) */}
      <nav 
        className="glass-panel"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '600px',
          height: '66px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderRadius: 'var(--radius-lg)',
          zIndex: 500
        }}
      >
        {/* Form Tab Button */}
        <button
          onClick={() => setActiveTab('form')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'form' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '8px 16px',
            transition: 'var(--transition)'
          }}
        >
          <ClipboardList size={22} style={{ strokeWidth: activeTab === 'form' ? 2.5 : 2 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: activeTab === 'form' ? 600 : 400 }}>Inspeção</span>
        </button>

        {/* Cloud Records Tab Button */}
        <button
          onClick={() => setActiveTab('records')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'records' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '8px 16px',
            transition: 'var(--transition)'
          }}
        >
          <FileSpreadsheet size={22} style={{ strokeWidth: activeTab === 'records' ? 2.5 : 2 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: activeTab === 'records' ? 600 : 400 }}>Relatórios</span>
        </button>

        {/* Sync Tab Button with Badge */}
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'queue' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '8px 16px',
            position: 'relative',
            transition: 'var(--transition)'
          }}
        >
          <Send size={22} style={{ strokeWidth: activeTab === 'queue' ? 2.5 : 2 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: activeTab === 'queue' ? 600 : 400 }}>Sincronizar</span>
          
          {/* Badge for pending queue items */}
          {queue.length > 0 && (
            <span 
              style={{
                position: 'absolute',
                top: '4px',
                right: '18px',
                backgroundColor: 'var(--accent-gold)',
                color: 'var(--bg-primary)',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {queue.length}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
}

export default App;
