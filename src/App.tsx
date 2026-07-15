import { useState, useEffect } from 'react';
import { db } from './utils/db';
import type { InspectionData, HistoryItem } from './utils/db';
import { InspectionForm } from './components/InspectionForm';
import { SyncQueue } from './components/SyncQueue';
import { ClipboardList, Send } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'queue'>('form');
  const [queue, setQueue] = useState<InspectionData[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
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

  // Initial load
  useEffect(() => {
    refreshData();
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
      {/* Elegante Top Bar */}
      <header 
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
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
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'form' ? (
          <InspectionForm 
            onInspectionAdded={refreshData} 
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

      {/* fixed bottom mobile navigation bar */}
      <nav 
        className="glass-panel"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
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
