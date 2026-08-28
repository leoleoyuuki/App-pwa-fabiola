import { useState, useEffect } from 'react';
import { db } from './utils/db';
import type { InspectionData, HistoryItem, DraftData } from './utils/db';
import { InspectionForm } from './components/InspectionForm';
import { SyncQueue } from './components/SyncQueue';
import { ClipboardList, Send, FileSpreadsheet, FileEdit } from 'lucide-react';
import { CloudHistory } from './components/CloudHistory';
import { DraftsList } from './components/DraftsList';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './utils/firebase';
import { Login } from './components/Login';

function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'drafts' | 'queue' | 'records'>('form');
  const [queue, setQueue] = useState<InspectionData[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [draftsCount, setDraftsCount] = useState<number>(0);
  const [loadedDraft, setLoadedDraft] = useState<DraftData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Loading states
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [fadeClass, setFadeClass] = useState('');
  
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Custom Webhook URL saved in localStorage (with VistoriaPro Apps Script URL as default)
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('fabiola_webhook_url') || 'https://script.google.com/macros/s/AKfycbyZJM6rSwBr3BKD_LawYeeRUoynUhQIol4GILJnnCYiMCCzD4B2-JfXFjJCwe2rC4Q5/exec';
  });

  // Persist Webhook URL when it changes
  useEffect(() => {
    localStorage.setItem('fabiola_webhook_url', webhookUrl);
  }, [webhookUrl]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetch('https://automacao-latex.vercel.app/health', { mode: 'no-cors' }).catch(() => {});
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Warm-up inicial silencioso do microserviço para eliminar cold-start
    if (navigator.onLine) {
      fetch('https://automacao-latex.vercel.app/health', { mode: 'no-cors' }).catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor auth state changes with offline fallback
  useEffect(() => {
    // Safety fallback: if offline or Firebase takes more than 1.2s to verify token, unlock UI for offline use
    const offlineTimeout = setTimeout(() => {
      const isCachedUser = localStorage.getItem('fabiola_user_logged_in') === 'true';
      if (isCachedUser && !user) {
        setUser(auth.currentUser || { email: 'perito@vistoriapro.com', uid: 'offline-user' });
      }
      setIsCheckingAuth(false);
    }, 1200);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(offlineTimeout);
      if (currentUser) {
        localStorage.setItem('fabiola_user_logged_in', 'true');
        setUser(currentUser);
      } else {
        if (navigator.onLine) {
          localStorage.removeItem('fabiola_user_logged_in');
          setUser(null);
        }
      }
      setIsCheckingAuth(false);
    });

    return () => {
      clearTimeout(offlineTimeout);
      unsubscribe();
    };
  }, []);

  // Helper to format perito display badge
  const getPeritoDisplayName = (email?: string): string => {
    if (!email) return 'Perito';
    const clean = email.toLowerCase().trim();
    if (clean === 'rodrigues.periciajud@gmail.com') return 'Perito: Rodrigues';
    if (clean === 'leok.perito@gmail.com') return 'Perito: Leo K.';
    if (clean === 'leoyuuki@dev.com') return 'Dev: Leo Yuuki';
    return `Perito: ${email.split('@')[0]}`;
  };

  // Fetch queue, history and drafts from IndexedDB (isolated per perito)
  const refreshData = async () => {
    try {
      const q = await db.getQueue(user?.email);
      const h = await db.getHistory(user?.email);
      const d = await db.getAllDrafts(user?.email);
      setQueue(q);
      setHistory(h);
      setDraftsCount(d.length);
    } catch (err) {
      console.error('Erro ao ler do IndexedDB:', err);
    }
  };

  // Handler when user clicks on a saved draft from the Drafts tab
  const handleSelectDraft = (draft: DraftData) => {
    setLoadedDraft(draft);
    setActiveTab('form');
  };

  // Handler when user starts a fresh inspection
  const handleNewInspection = () => {
    setLoadedDraft(null);
    setActiveTab('form');
  };

  // Re-fetch queue and history whenever user changes
  useEffect(() => {
    if (user?.email) {
      refreshData();
    }
  }, [user?.email]);

  // Initial load with brand exposure duration and background precache
  useEffect(() => {
    const init = async () => {
      await refreshData();
      setTimeout(() => {
        setFadeClass('fade-out');
        setTimeout(() => {
          setIsAppLoading(false);
        }, 500);
      }, 1000);
    };
    init();
  }, []);

  // If checking authentication status, show loading splash screen
  if (isCheckingAuth) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <img src="/logo192.png" className="loading-logo" alt="Logo" />
          <h2 className="loading-title">VistoriaPro</h2>
          <p className="loading-subtitle">Arquiteta & Designer</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show the login panel
  if (!user) {
    return <Login onLoginSuccess={refreshData} />;
  }

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
            <h2 className="loading-title">VistoriaPro</h2>
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
            VistoriaPro
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              style={{ 
                fontSize: '0.72rem', 
                backgroundColor: 'var(--accent-gold-light)', 
                color: 'var(--accent-gold-hover)',
                border: '1px solid var(--accent-gold)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontWeight: 600,
                letterSpacing: '0.02em'
              }}
            >
              {getPeritoDisplayName(user?.email)}
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
            userEmail={user?.email}
            loadedDraft={loadedDraft}
            onClearLoadedDraft={() => {
              setLoadedDraft(null);
              refreshData();
            }}
          />
        ) : activeTab === 'drafts' ? (
          <DraftsList 
            userEmail={user?.email}
            onSelectDraft={handleSelectDraft}
            onNewInspection={handleNewInspection}
          />
        ) : activeTab === 'records' ? (
          <CloudHistory 
            webhookUrl={webhookUrl}
            isOnline={isOnline}
            userEmail={user?.email}
            onEditRecord={handleSelectDraft}
          />
        ) : (
          <SyncQueue 
            queue={queue}
            history={history}
            refreshData={refreshData}
            webhookUrl={webhookUrl}
            setWebhookUrl={setWebhookUrl}
            isOnline={isOnline}
            userEmail={user?.email}
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
            padding: '8px 12px',
            transition: 'var(--transition)'
          }}
        >
          <ClipboardList size={22} style={{ strokeWidth: activeTab === 'form' ? 2.5 : 2 }} />
          <span style={{ fontSize: '0.72rem', fontWeight: activeTab === 'form' ? 600 : 400 }}>Inspeção</span>
        </button>

        {/* Drafts Tab Button with Badge */}
        <button
          onClick={() => {
            refreshData();
            setActiveTab('drafts');
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'drafts' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '8px 12px',
            position: 'relative',
            transition: 'var(--transition)'
          }}
        >
          <FileEdit size={22} style={{ strokeWidth: activeTab === 'drafts' ? 2.5 : 2 }} />
          <span style={{ fontSize: '0.72rem', fontWeight: activeTab === 'drafts' ? 600 : 400 }}>Rascunhos</span>
          
          {/* Badge for saved drafts */}
          {draftsCount > 0 && (
            <span 
              style={{
                position: 'absolute',
                top: '4px',
                right: '12px',
                backgroundColor: 'var(--accent-gold)',
                color: 'var(--bg-primary)',
                fontSize: '0.62rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                minWidth: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {draftsCount}
            </span>
          )}
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
            padding: '8px 12px',
            transition: 'var(--transition)'
          }}
        >
          <FileSpreadsheet size={22} style={{ strokeWidth: activeTab === 'records' ? 2.5 : 2 }} />
          <span style={{ fontSize: '0.72rem', fontWeight: activeTab === 'records' ? 600 : 400 }}>Relatórios</span>
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
            padding: '8px 12px',
            position: 'relative',
            transition: 'var(--transition)'
          }}
        >
          <Send size={22} style={{ strokeWidth: activeTab === 'queue' ? 2.5 : 2 }} />
          <span style={{ fontSize: '0.72rem', fontWeight: activeTab === 'queue' ? 600 : 400 }}>Sincronizar</span>
          
          {/* Badge for pending queue items */}
          {queue.length > 0 && (
            <span 
              style={{
                position: 'absolute',
                top: '4px',
                right: '12px',
                backgroundColor: 'var(--accent-gold)',
                color: 'var(--bg-primary)',
                fontSize: '0.62rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                minWidth: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
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
