import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { 
  Search, 
  RefreshCw, 
  FileSpreadsheet, 
  ChevronRight, 
  X, 
  ExternalLink,
  Loader2,
  Calendar,
  User,
  Zap,
  Home,
  Tv,
  CheckSquare,
  FileText
} from 'lucide-react';

interface CloudHistoryProps {
  webhookUrl: string;
  isOnline: boolean;
}

export const CloudHistory: React.FC<CloudHistoryProps> = ({
  webhookUrl,
  isOnline
}) => {
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Load cached records on mount
  useEffect(() => {
    const loadCached = async () => {
      try {
        const cached = await db.getCloudRecords();
        if (cached) {
          setRecords(cached);
          setFilteredRecords(cached);
        }
      } catch (err) {
        console.error('Erro ao ler cache de registros:', err);
      }
    };
    loadCached();
    // Auto-fetch if online and we have a valid Google script URL
    if (isOnline && webhookUrl && webhookUrl.includes('script.google.com')) {
      fetchRecords();
    }
  }, [webhookUrl, isOnline]);

  // Filter records dynamically when search term or records change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecords(records);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = records.filter(rec => {
      const nome = (rec.NomedoAutor || '').toLowerCase();
      const proc = (rec.NúmerodoProcesso || '').toLowerCase();
      const reu = (rec.RéuConcessionária || rec['Réu/Concessionária'] || '').toLowerCase();
      const med = (rec.NúmerodoMedidor || '').toLowerCase();
      return nome.includes(term) || proc.includes(term) || reu.includes(term) || med.includes(term);
    });
    setFilteredRecords(filtered);
  }, [searchTerm, records]);

  // Fetch records from Google Apps Script
  const fetchRecords = async () => {
    if (!webhookUrl || !webhookUrl.includes('script.google.com')) {
      setErrorMsg('Configure uma URL de Web App do Google Apps Script válida nas configurações.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(webhookUrl, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Erro HTTP: Status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (Array.isArray(data)) {
        // Sort newest first based on Timestamp column (Data de Envio)
        const sorted = [...data].reverse();
        setRecords(sorted);
        setFilteredRecords(sorted);
        await db.saveCloudRecords(sorted); // Cache locally
      } else {
        throw new Error('Formato de resposta inesperado do Google Script.');
      }
    } catch (err: any) {
      console.error('Erro ao ler registros da planilha:', err);
      setErrorMsg(`Erro de conexão: ${err.message || err}`);
      
      // Load cache if fetch fails
      const cached = await db.getCloudRecords();
      if (cached) {
        setRecords(cached);
        setFilteredRecords(cached);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '16px 16px 120px 16px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', fontWeight: 400, color: 'var(--text-primary)' }}>
          Relatórios Enviados
        </h1>
        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
          Registros sincronizados com o Google Sheets
        </p>
      </div>

      {/* Control Actions & Search */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
          <div className="form-group" style={{ flexGrow: 1, marginBottom: 0, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0', top: '12px', color: 'var(--text-secondary)' }}>
              <Search size={16} />
            </span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por Autor, Processo, Réu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '28px' }}
            />
          </div>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={fetchRecords} 
            disabled={isLoading || !isOnline}
            style={{ width: '44px', height: '44px', padding: 0, flexShrink: 0, borderRadius: 'var(--radius-sm)' }}
            title="Atualizar dados da nuvem"
          >
            {isLoading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
          </button>
        </div>

        {!isOnline && (
          <p style={{ fontSize: '0.75rem', color: 'var(--accent-rust)', fontStyle: 'italic', textAlign: 'center' }}>
            Modo offline - Exibindo dados do cache local. Conecte-se para atualizar.
          </p>
        )}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: 'var(--accent-rust-light)', color: 'var(--accent-rust)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '20px' }}>
          <X size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Records List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <FileSpreadsheet size={32} style={{ color: 'var(--text-secondary)', marginBottom: '12px', marginInline: 'auto' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isLoading ? 'Carregando planilha...' : 'Nenhum relatório encontrado na nuvem.'}
            </p>
          </div>
        ) : (
          filteredRecords.map((rec, index) => (
            <div 
              key={index} 
              className="card" 
              onClick={() => setSelectedRecord(rec)}
              style={{ 
                padding: '16px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer' 
              }}
            >
              <div style={{ paddingRight: '12px' }}>
                <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
                  {rec.NomedoAutor || 'Autor sem nome'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Proc: {rec.NúmerodoProcesso || 'Não especificado'}
                </p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>📅 {rec.DatadaVistoria || 'S/D'}</span>
                  <span>⚡ {rec.TipodeAção || 'Consumo'}</span>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
            </div>
          ))
        )}
      </div>

      {/* Details View Modal */}
      {selectedRecord && (
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
          <div className="card fade-in" style={{ 
            maxWidth: '500px', 
            width: '100%', 
            maxHeight: '85vh', 
            overflowY: 'auto', 
            padding: '24px',
            position: 'relative'
          }}>
            
            {/* Close Button */}
            <button 
              type="button" 
              onClick={() => setSelectedRecord(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '20px', paddingRight: '24px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-gold)', fontWeight: 600 }}>
                Detalhes do Relatório
              </span>
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
                {selectedRecord.NomedoAutor}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Sincronizado em: {selectedRecord.DatadeEnvio || 'S/D'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Block 1: Dados Gerais */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <User size={12} /> DADOS GERAIS
                </span>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Processo:</strong> {selectedRecord.NúmerodoProcesso || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Réu / Concessionária:</strong> {selectedRecord['Réu/Concessionária'] || selectedRecord.RéuConcessionária || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Tipo de Ação:</strong> {selectedRecord.TipodeAção || 'Não informado'}</p>
              </div>

              {/* Block 2: Vistoria */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Calendar size={12} /> DADOS DA VISTORIA
                </span>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Data da Vistoria:</strong> {selectedRecord.DatadaVistoria || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Nº da Vistoria:</strong> {selectedRecord.NºdaVistoria || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Período:</strong> {selectedRecord.PeríododaVistoria || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Representante Autor:</strong> {selectedRecord['RepresentaçãoAutorPresente?'] || selectedRecord.RepresentaçãoAutorPresente || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Representante Réu:</strong> {selectedRecord['RepresentaçãoRéuPresente?'] || selectedRecord.RepresentaçãoRéuPresente || 'Não informado'}</p>
                {selectedRecord['Obs.PresençadasPartes'] && (
                  <p style={{ fontSize: '0.85rem', margin: '8px 0 4px 0', padding: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', fontStyle: 'italic' }}>
                    <strong>Observações de Presença:</strong> {selectedRecord['Obs.PresençadasPartes']}
                  </p>
                )}
              </div>

              {/* Block 3: Medidor */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Zap size={12} /> MEDIDOR DE ENERGIA
                </span>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Número do Medidor:</strong> {selectedRecord.NúmerodoMedidor || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Possui Chip?</strong> {selectedRecord['MedidorcomChip?'] || selectedRecord.MedidorcomChip || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Condições Visuais:</strong> {selectedRecord.CondiçõesdoMedidor || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Houve Corte?</strong> {selectedRecord.CortedeEnergia || selectedRecord['Corte de Energia?'] || 'Não informado'}</p>
              </div>

              {/* Block 4: Características */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Home size={12} /> UNIDADE CONSUMIDORA
                </span>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Pessoas Residentes:</strong> {selectedRecord.PessoasResidentes || 'Não informado'}</p>
                <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Cômodos da UC:</strong> {selectedRecord.QuantidadedeCômodos || 'Não informado'}</p>
              </div>

              {/* Block 5: Eletrodomésticos */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Tv size={12} /> APARELHOS CADASTRADOS
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', marginTop: '6px' }}>
                  <div>💡 Lâmpadas: <strong>{selectedRecord.NºdeLâmpadas || 0}</strong></div>
                  <div>📺 TVs: <strong>{selectedRecord.NºdeTVs || 0}</strong></div>
                  <div>💨 Ventiladores: <strong>{selectedRecord.NºdeVentiladores || 0}</strong></div>
                  <div>🌀 Vent. Teto: <strong>{selectedRecord.NºdeVentiladoresdeTeto || 0}</strong></div>
                  <div>❄️ Ar Condicionado: <strong>{selectedRecord.NºdeArCondicionados || 0}</strong></div>
                  <div>🧊 Geladeiras: <strong>{selectedRecord.NºdeGeladeiras || 0}</strong></div>
                  <div>🚿 Chuveiro Elétrico: <strong>{selectedRecord.NºdeChuveirosElétricos || 0}</strong></div>
                  <div>🧺 Máquina Lavar: <strong>{selectedRecord.NºdeMáquinasdeLavar || 0}</strong></div>
                  <div>🥶 Freezers: <strong>{selectedRecord.NºdeFreezers || 0}</strong></div>
                </div>
              </div>

              {/* Block 6: Checklist */}
              {selectedRecord.ChecklistTécnico && (
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <CheckSquare size={12} /> CHECKLIST TÉCNICO
                  </span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {selectedRecord.ChecklistTécnico}
                  </p>
                </div>
              )}

              {/* Block 7: Observações Finais */}
              {selectedRecord.ObservaçõesFinaisdoPerito && (
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <FileText size={12} /> OBSERVAÇÕES DO PERITO
                  </span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                    {selectedRecord.ObservaçõesFinaisdoPerito}
                  </p>
                </div>
              )}

              {/* Drive Link Action */}
              {(selectedRecord['LinkdaPasta(GoogleDrive)'] || selectedRecord.LinkdaPastaGoogleDrive) && (
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => {
                    const url = selectedRecord['LinkdaPasta(GoogleDrive)'] || selectedRecord.LinkdaPastaGoogleDrive;
                    window.open(url, '_blank');
                  }}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  <ExternalLink size={16} />
                  Abrir Pasta no Google Drive
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
