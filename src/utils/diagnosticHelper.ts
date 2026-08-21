export interface DiagnosticInfo {
  title: string;
  cause: string;
  recommendation: string;
  technicalDetails: string;
  canCopy: boolean;
}

/**
 * Translates technical error messages into clear, actionable Portuguese diagnoses
 * and generates a copyable support report for quick WhatsApp sharing.
 */
export function parseSyncError(
  err: any,
  inspectionName: string,
  photoCount: number,
  processNum: string
): DiagnosticInfo {
  const rawMsg = String(err?.message || err || 'Erro desconhecido');
  const lower = rawMsg.toLowerCase();

  let title = 'Erro na Sincronização';
  let cause = 'Não foi possível completar o envio dos dados para o Google.';
  let recommendation = 'Tente sincronizar novamente em alguns instantes. Seus dados continuam salvos no aparelho.';

  if (
    lower.includes('load failed') || 
    lower.includes('failed to fetch') || 
    lower.includes('networkerror') || 
    lower.includes('conexão') ||
    lower.includes('network request failed')
  ) {
    title = 'Falha de Conexão ou Rede Instável (Load failed)';
    cause = `A conexão de internet oscilou ou foi interrompida durante o envio do relatório com ${photoCount} fotos.`;
    recommendation = 'Conecte-se a uma rede Wi-Fi ou 4G estável e toque em "Sincronizar Fila" novamente. Suas fotos e vistorias continuam 100% salvas no seu aparelho.';
  } else if (lower.includes('403') || lower.includes('401') || lower.includes('unauthorized') || lower.includes('permiss')) {
    title = 'Permissão de Acesso Negada no Google (403)';
    cause = 'O Google Apps Script precisa estar configurado com acesso público ("Qualquer pessoa").';
    recommendation = 'Acesse o Google Apps Script > Implantar > Gerenciar implantações e defina "Quem tem acesso" como "Qualquer pessoa" (Anyone).';
  } else if (lower.includes('404') || lower.includes('not found')) {
    title = 'URL do Google Script Não Encontrada (404)';
    cause = 'O link do Web App do Google Apps Script configurado está incorreto ou foi excluído.';
    recommendation = 'Verifique a URL do Webhook nas configurações do app e certifique-se de que termina com /exec.';
  } else if (lower.includes('timeout') || lower.includes('esgotado')) {
    title = 'Tempo Limite de Envio Esgotado (Timeout)';
    cause = 'O envio demorou mais que o tempo limite do navegador. A internet pode estar muito lenta.';
    recommendation = 'Aguarde alguns instantes e tente sincronizar novamente. O script possui proteção contra duplicidade.';
  } else if (lower.includes('script') || lower.includes('500') || lower.includes('status 500')) {
    title = 'Erro Interno no Google Apps Script (500)';
    cause = 'O script do Google encontrou uma falha ao tentar criar a pasta no Drive ou escrever na planilha.';
    recommendation = 'Verifique se a planilha e a pasta principal do Google Drive continuam disponíveis e com espaço na conta do Google.';
  }

  const technicalReport = `[DIAGNÓSTICO DE SINCRONIZAÇÃO - VISTORIAPRO]
Data e Hora: ${new Date().toLocaleString('pt-BR')}
Autor da Vistoria: ${inspectionName}
Número do Processo: ${processNum || 'Não especificado'}
Quantidade de Fotos: ${photoCount}
Erro Técnico: ${rawMsg}
Status da Rede: ${navigator.onLine ? 'Online (Conectado)' : 'Offline (Sem Conexão)'}
Navegador / Sistema: ${navigator.userAgent}`;

  return {
    title,
    cause,
    recommendation,
    technicalDetails: technicalReport,
    canCopy: true
  };
}
