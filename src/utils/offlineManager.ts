import { db } from './db';

const CACHE_NAME = 'vistoriapro-cache-v2';

export interface PrecacheResult {
  success: boolean;
  fileCount: number;
  message: string;
}

export interface OfflineStatus {
  isReady: boolean;
  lastDownloadedAt: string | null;
}

/**
 * Checks if the app has been pre-cached for full offline usage.
 */
export function getOfflineStatus(): OfflineStatus {
  const timestamp = localStorage.getItem('fabiola_offline_precache_date');
  if (!timestamp) {
    return { isReady: false, lastDownloadedAt: null };
  }

  const date = new Date(parseInt(timestamp, 10));
  const formatted = date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { isReady: true, lastDownloadedAt: formatted };
}

/**
 * Downloads all frontend scripts, stylesheets, fonts, assets, and syncs
 * the Google Sheets agenda into local IndexedDB for 100% offline field reliability.
 */
export async function downloadAppForOffline(
  webhookUrl: string,
  onProgress?: (status: string, percent: number) => void,
  peritoEmail?: string
): Promise<PrecacheResult> {
  try {
    onProgress?.('Iniciando preparação para uso offline...', 10);

    // 1. Collect all static and dynamic assets from current DOM
    const urlsToCache = new Set<string>([
      '/',
      '/index.html',
      '/manifest.json',
      '/logo192.png',
      '/logo512.png',
      '/favicon.svg',
      '/icons.svg'
    ]);

    // Find all scripts in document
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach((s) => {
      const src = s.getAttribute('src');
      if (src && !src.startsWith('chrome-extension')) {
        urlsToCache.add(src);
      }
    });

    // Find all style links in document
    const links = document.querySelectorAll('link[rel="stylesheet"], link[rel="icon"], link[rel="apple-touch-icon"]');
    links.forEach((l) => {
      const href = l.getAttribute('href');
      if (href && !href.startsWith('data:')) {
        urlsToCache.add(href);
      }
    });

    onProgress?.('Baixando código e interface do aplicativo...', 30);

    // 2. Open Cache Storage directly
    let cachedCount = 0;
    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      const urlList = Array.from(urlsToCache);

      for (let i = 0; i < urlList.length; i++) {
        const url = urlList[i];
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response.ok) {
            await cache.put(url, response);
            cachedCount++;
          }
        } catch (err) {
          console.warn('Aviso: Não foi possível pré-carregar URL:', url, err);
        }
        const pct = 30 + Math.round(((i + 1) / urlList.length) * 40);
        onProgress?.(`Salvando arquivo ${i + 1} de ${urlList.length}...`, pct);
      }
    }

    onProgress?.('Baixando processos agendados da nuvem...', 75);

    // 3. Download Google Sheets processes agenda for offline search
    if (webhookUrl && webhookUrl.includes('script.google.com') && navigator.onLine) {
      try {
        const types = ['energia', 'agua', 'imobiliario', 'gas'];
        for (const t of types) {
          const peritoQuery = peritoEmail ? `&perito=${encodeURIComponent(peritoEmail)}` : '';
          const response = await fetch(`${webhookUrl}?action=processos&tipo=${t}${peritoQuery}`);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              await db.saveScheduledProcesses(data, peritoEmail);
            }
          }
        }
      } catch (procErr) {
        console.warn('Não foi possível sincronizar processos no momento:', procErr);
      }
    }

    onProgress?.('Concluindo validação offline...', 95);

    // 4. Save offline readiness state in localStorage
    localStorage.setItem('fabiola_offline_precache_date', Date.now().toString());
    localStorage.setItem('fabiola_user_logged_in', 'true');

    onProgress?.('Tudo pronto!', 100);

    return {
      success: true,
      fileCount: cachedCount,
      message: 'Aplicativo e processos salvos no aparelho com sucesso!'
    };
  } catch (error: any) {
    console.error('Erro no pre-cache offline:', error);
    return {
      success: false,
      fileCount: 0,
      message: error.message || 'Falha ao baixar recursos offline.'
    };
  }
}
