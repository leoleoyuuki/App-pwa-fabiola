/**
 * =========================================================================
 * VISTORIAPRO - GOOGLE APPS SCRIPT MULTI-PERITO & AUTOMAÇÃO DE LAUDOS
 * =========================================================================
 * Contempla:
 *  - Chave Mestre ON/OFF para Ativar/Desativar Geração de Laudo Automático
 *  - Leitura prioritária da aba "Processos Energia" (ou Processos Água / Imobiliário / Gás / Pré-Vistoria)
 *  - Mapeamento dinâmico e flexível de colunas (Histórico de Consumo CSV Multilinha, Quesitos, etc.)
 *  - Exportação e salvamento de todos os arquivos fontes (.pdf, dados.tex, historico_consumo.csv, modelo_auto.tex) na pasta do Google Drive
 *  - Roteamento por perito (Rodrigues, Leo K., Leo Yuuki Dev)
 *  - Dupla camada anti-duplicidade (Cache do Google + Verificação das últimas 30 linhas)
 *  - Organização de fotos (Fotos da Residência e Fotos do Medidor) com numeração sequencial
 */

// ⚙️ 1. CONFIGURAÇÃO GERAL DA AUTOMAÇÃO E COMPILAÇÃO DE LAUDOS
var CONFIG_AUTOMACAO = {
  // 🔘 CHAVE MESTRE (ON / OFF):
  // false = DESLIGADO (Apenas salva fotos no Drive e grava na Planilha)
  // true  = LIGADO (Salva fotos/dados E dispara o microserviço para compilar o PDF Oficial e fontes)
  ATIVAR_GERACAO_LAUDO_AUTOMATICA: true,

  // 🌐 URL do Microserviço Backend de Compilação LaTeX (Vercel / Cloud Run)
  URL_MICROSERVICO_LAUDO: "https://automacao-latex.vercel.app"
};

// 👥 2. TABELA CENTRAL DE CONFIGURAÇÃO DE PERITOS
var CONFIG_PERITOS = {
  "rodrigues.periciajud@gmail.com": {
    nome: "Rodrigues",
    spreadsheetId: "1APnRdpsxg6ufg_xBZjmvruSGf2hrrXYlrrlJwfBLyOk",
    mainFolderId: "1dIFg4HCfX0C3cG_8WrbFK5PHETt6VUQV"
  },
  "leok.perito@gmail.com": {
    nome: "Leo K.",
    spreadsheetId: "1dC4Yn6XSmEOBBraiTAWUMqUuYzmpZkXx84Ert6fgZcA",
    mainFolderId: "1O-9Xu0tLGZBjmFY8YkL0jzPy2vS6KFR7"
  },
  "leoyuuki@dev.com": {
    nome: "Leo Yuuki (Dev)",
    spreadsheetId: "1FN7kF425xtjcwKN7_IXChw1mw5Qkt4vfEKW_vs8s-jg",
    mainFolderId: "1utF69gWlshwlHfQUXxQ8gskLC8bRo4e0"
  }
};

/**
 * Localiza a configuração do perito pelo e-mail com sanitização.
 */
function getPeritoConfig(email) {
  if (!email) return null;
  var clean = String(email).toLowerCase().trim();
  return CONFIG_PERITOS[clean] || null;
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * =========================================================================
 * 1. GET REQUESTS: Busca de Processos Agendados, Pré-Vistorias e Laudos
 * =========================================================================
 */
function doGet(e) {
  try {
    var peritoEmail = (e && e.parameter && e.parameter.perito) ? e.parameter.perito : "";
    var config = getPeritoConfig(peritoEmail);

    if (!config) {
      return ContentService.createTextOutput(JSON.stringify({
        error: "E-mail de perito não informado ou não cadastrado (" + (peritoEmail || "vazio") + "). Por favor, faça login novamente no app."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var spreadsheetId = config.spreadsheetId;
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var action = e && e.parameter ? e.parameter.action : "";
    var tipo = e && e.parameter && e.parameter.tipo ? e.parameter.tipo.toLowerCase().trim() : "energia";

    // CASO 1: Busca a lista de Processos / Pré-Vistorias
    if (action === "processos" || action === "previstoria") {
      var sheetProcessos = obterAbaProcessosPreVistoria(ss, tipo);
      if (!sheetProcessos) {
        var mapaNomePadrao = {
          "energia": "Processos Energia",
          "agua": "Processos Água",
          "imobiliario": "Processos Imobiliário",
          "gas": "Processos Gás"
        };
        var nomeCriar = mapaNomePadrao[tipo] || "Processos Energia";
        sheetProcessos = ss.insertSheet(nomeCriar);
        sheetProcessos.appendRow([
          "Tipo de Ação", "Número do Processo", "Nome do Autor", "Nome do Réu", "Vara / Comarca",
          "Número do Cliente", "Número do TOI", "Data Lavratura TOI", "Irregularidade Alegada (Gato)",
          "Valor Recuperação (R$)", "Endereço Completo", "Objetivo da Perícia", "Resumo do Processo",
          "Alegações do Autor", "Contestações do Réu", "Início Redução (Mês/Ano)", "Fim Redução (Mês/Ano)",
          "Consumo Médio (kWh)", "Consumo Reclamado (kWh)", "Histórico Consumo Início", "Histórico Consumo Fim",
          "Histórico de Consumo (CSV Multilinha)", "Quesitos Juízo", "Quesitos Autor", "Quesitos Réu", "Status Automação", "Link Laudo PDF"
        ]);
        sheetProcessos.autoResizeColumns(1, 27);
        return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
      }

      var dataProcessos = sheetProcessos.getDataRange().getValues();
      if (dataProcessos.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
      }

      var headers = dataProcessos[0];
      var arrayProcessos = [];

      for (var i = 1; i < dataProcessos.length; i++) {
        var row = dataProcessos[i];
        if (!row[0] && !row[1] && !row[2]) continue;

        var record = {};
        for (var c = 0; c < headers.length; c++) {
          var hName = headers[c] ? headers[c].toString().trim() : ("col_" + c);
          var val = row[c];
          if (val instanceof Date) {
            val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
          }
          record[hName] = val;
        }

        // Mapeamento compatível para dropdowns do formulário
        var colProc = acharIndiceColuna(headers, ["numerodoprocesso", "processo", "numprocesso", "cnj"]);
        var colAutor = acharIndiceColuna(headers, ["nomedoautor", "autor", "parteautora"]);
        var colReu = acharIndiceColuna(headers, ["nomedoreu", "reu", "concessionaria"]);
        var colData = acharIndiceColuna(headers, ["datadavistoria", "datavistoria", "data"]);

        record.numeroProcesso = colProc >= 0 ? String(row[colProc] || "") : (row[1] || "");
        record.nomeAutor = colAutor >= 0 ? String(row[colAutor] || "") : (row[2] || "");
        record.reuConcessionaria = colReu >= 0 ? String(row[colReu] || "") : (row[3] || "");
        record.dataVistoria = colData >= 0 ? String(row[colData] || "") : (row[0] || "");

        arrayProcessos.push(record);
      }

      return ContentService.createTextOutput(JSON.stringify(arrayProcessos)).setMimeType(ContentService.MimeType.JSON);
    }
    
    // CASO 2: Busca histórico geral de Relatórios Enviados
    var mapaAbasLaudos = {
      "energia": "Energia",
      "agua": "Água",
      "imobiliario": "Imobiliário",
      "gas": "Gás"
    };
    
    var nomeAbaLaudos = mapaAbasLaudos[tipo] || "Energia";
    var sheetLaudos = buscarAbaFlexivel(ss, nomeAbaLaudos) || ss.getSheets()[0];
    
    if (sheetLaudos.getLastRow() <= 1) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheetLaudos.getDataRange().getValues();
    var headersLaudos = data[0];
    var jsonArray = [];
    
    for (var i = 1; i < data.length; i++) {
      var rowL = data[i];
      var recordL = {};
      
      for (var j = 0; j < headersLaudos.length; j++) {
        var value = rowL[j];
        var headerName = headersLaudos[j].toString().trim();
        var keyName = headerName.replace(/\s+/g, '');
        
        if (value instanceof Date) {
          if (j === 0 || keyName === "DatadeEnvio") {
            value = Utilities.formatDate(value, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
          } else {
            value = Utilities.formatDate(value, Session.getScriptTimeZone(), "dd/MM/yyyy");
          }
        } else if (value && typeof value === "string") {
          if (keyName === "DatadaVistoria" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            var parts = value.split("-");
            if (parts.length === 3) {
              value = parts[2] + "/" + parts[1] + "/" + parts[0];
            }
          }
        }
        recordL[keyName] = value;
      }
      jsonArray.push(recordL);
    }
    
    return ContentService.createTextOutput(JSON.stringify(jsonArray)).setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * =========================================================================
 * 2. POST REQUESTS: Gravação de Vistoria, Fotos no Drive e Planilha
 * =========================================================================
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "erro", 
      message: "Servidor ocupado processando. Tente novamente em alguns segundos." 
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var data = JSON.parse(e.postData.contents);
    var peritoEmail = data.peritoEmail || data.emailPerito || "";
    var config = getPeritoConfig(peritoEmail);

    if (!config) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "erro",
        message: "E-mail de perito (" + (peritoEmail || "não informado") + ") não cadastrado no sistema."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var mainFolderId = config.mainFolderId;
    var spreadsheetId = config.spreadsheetId;
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var tipo = (data.tipoAcao || data.tipoInspecao || "energia").toLowerCase().trim();

    // 2.1 GRAVAÇÃO DE DADOS DE PRÉ-VISTORIA (Extraídos pelo Gemini Spark)
    if (data.action === "salvar_previstoria") {
      var sheetDestino = obterAbaProcessosPreVistoria(ss, tipo);
      if (!sheetDestino) {
        sheetDestino = ss.insertSheet("Processos Energia");
        sheetDestino.appendRow([
          "Tipo de Ação", "Número do Processo", "Nome do Autor", "Nome do Réu", "Vara / Comarca",
          "Número do Cliente", "Número do TOI", "Data Lavratura TOI", "Irregularidade Alegada (Gato)",
          "Valor Recuperação (R$)", "Endereço Completo", "Objetivo da Perícia", "Resumo do Processo",
          "Alegações do Autor", "Contestações do Réu", "Início Redução (Mês/Ano)", "Fim Redução (Mês/Ano)",
          "Consumo Médio (kWh)", "Consumo Reclamado (kWh)", "Histórico Consumo Início", "Histórico Consumo Fim",
          "Histórico de Consumo (CSV Multilinha)", "Quesitos Juízo", "Quesitos Autor", "Quesitos Réu", "Status Automação", "Link Laudo PDF"
        ]);
        sheetDestino.autoResizeColumns(1, 27);
      }

      var numProcessoLimpo = (data.numeroProcesso || "").replace(/[^0-9]/g, "");
      var dataPreRows = sheetDestino.getDataRange().getValues();
      var linhaExistente = -1;

      for (var r = 1; r < dataPreRows.length; r++) {
        var procRowLimpo = String(dataPreRows[r][1] || "").replace(/[^0-9]/g, "");
        if (procRowLimpo && procRowLimpo === numProcessoLimpo) {
          linhaExistente = r + 1;
          break;
        }
      }

      var novaLinhaPre = [
        data.tipoAcao || "Consumo",
        data.numeroProcesso || "",
        capitalizarNome(data.nomeAutor || ""),
        data.nomeReu || data.reuConcessionaria || "",
        data.varaJuizo || "",
        data.numeroCliente || "",
        data.numeroToi || "",
        data.dataLavraturaToi || "",
        data.irregularidadeAlegada || "",
        data.valorRecuperacao || "",
        data.enderecoPericia || "",
        data.objetivoPericia || "",
        data.resumoProcesso || "",
        data.alegacoesAutor || "",
        data.contestacoesReu || "",
        data.reducaoMesInicio ? (data.reducaoMesInicio + "/" + (data.reducaoAnoInicio || "")) : "",
        data.reducaoMesFim ? (data.reducaoMesFim + "/" + (data.reducaoAnoFim || "")) : "",
        data.consumoMedio || "",
        data.consumoMedioReclamado || "",
        data.historicoConsumoInicio || "",
        data.historicoConsumoFim || "",
        data.historicoConsumoCsv || "",
        data.quesitosJuizo || "",
        data.quesitosAutor || "",
        data.quesitosReu || "",
        "Pré-Vistoria Concluída (Aguardando Campo)",
        ""
      ];

      if (linhaExistente > 0) {
        sheetDestino.getRange(linhaExistente, 1, 1, novaLinhaPre.length).setValues([novaLinhaPre]);
      } else {
        sheetDestino.appendRow(novaLinhaPre);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "sucesso",
        message: "Pré-Vistoria registrada com sucesso na aba " + sheetDestino.getName() + ".",
        perito: config.nome
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var nomeAutorOriginal = data.nomeAutor || "Autor Sem Nome";
    var nomeAutor = capitalizarNome(nomeAutorOriginal);
    
    // 🛡️ CAMADA 1: IDEMPOTÊNCIA POR CACHE DO GOOGLE (6 horas)
    var cache = CacheService.getScriptCache();
    var idInspecao = data.id ? String(data.id) : (nomeAutor + "_" + (data.numeroProcesso || "") + "_" + (data.dataVistoria || ""));
    var cacheKey = "proc_" + idInspecao.replace(/[^a-zA-Z0-9_]/g, "");

    if (cache.get(cacheKey)) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "sucesso", 
        message: "Vistoria já gravada anteriormente (duplicação prevenida por cache).",
        perito: config.nome,
        duplicatePrevented: true
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 1. Cria ou recupera a pasta no Google Drive do Perito
    var mainFolder = DriveApp.getFolderById(mainFolderId);
    
    var dataVistoriaFormatada = "";
    if (data.dataVistoria) {
      var partesDate = data.dataVistoria.toString().split("-");
      if (partesDate.length === 3) {
        dataVistoriaFormatada = partesDate[2] + "-" + partesDate[1] + "-" + partesDate[0];
      } else {
        dataVistoriaFormatada = data.dataVistoria.toString().replace(/\//g, "-");
      }
    }
    
    var pastaVistoriaNome = dataVistoriaFormatada ? (dataVistoriaFormatada + " - " + nomeAutor) : nomeAutor;
    var inspectionFolder = criarOuObterPasta(mainFolder, pastaVistoriaNome);
    
    var subfolderImovel = criarOuObterPasta(inspectionFolder, "Fotos da Residência");
    var subfolderMedidor = criarOuObterPasta(inspectionFolder, "Fotos do Medidor");
    
    // 2. Salva Fotografias
    var urlsFotosImovel = [];
    if (data.photosImovel && Array.isArray(data.photosImovel)) {
      urlsFotosImovel = salvarFotosBase64(data.photosImovel, subfolderImovel, "Imovel_");
    }
    
    var urlsFotosMedidor = [];
    if (data.photosMedidor && Array.isArray(data.photosMedidor)) {
      urlsFotosMedidor = salvarFotosBase64(data.photosMedidor, subfolderMedidor, "Medidor_");
    }
    
    // 3. Gravação na Planilha de Vistorias
    var mapaAbas = {
      "energia": "Energia",
      "agua": "Água",
      "imobiliario": "Imobiliário",
      "gas": "Gás"
    };
    
    var nomeAba = mapaAbas[tipo] || "Energia";
    var sheet = buscarAbaFlexivel(ss, nomeAba);
    
    if (!sheet) {
      sheet = ss.insertSheet(nomeAba);
      var cabecalhosPadrao = [
        "Data de Envio", "Data da Vistoria", "Nome do Autor", "Número do Processo",
        "Réu / Concessionária", "Número da Vistoria", "Período da Vistoria", "Qtd Pessoas", "Qtd Cômodos",
        "Lâmpadas", "TVs", "Ventiladores", "Ventiladores Teto", "Ar Condicionado", "Geladeiras",
        "Chuveiros", "Máquinas Lavar", "Freezers", "Checklist", "Número do Medidor",
        "Medidor com Chip", "Condições do Medidor", "Corte de Energia", "Obs. do Medidor", "Representação Autor",
        "Representação Réu", "Obs Presença", "Obs Finais", "Fotos Imóvel (Links)", "Fotos Medidor (Links)", "Pasta Drive", "Laudo PDF"
      ];
      sheet.appendRow(cabecalhosPadrao);
      sheet.autoResizeColumns(1, cabecalhosPadrao.length);
    }
    
    // 🛡️ CAMADA 2: ANTI-DUPLICIDADE POR VERIFICAÇÃO NAS ÚLTIMAS 30 LINHAS
    if (isRegistroDuplicado(sheet, data.numeroProcesso, nomeAutor, data.dataVistoria)) {
      cache.put(cacheKey, "gravado", 21600);
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "sucesso", 
        message: "Vistoria já consta na planilha (duplicação prevenida na planilha).",
        folderUrl: inspectionFolder.getUrl(),
        perito: config.nome,
        duplicatePrevented: true
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var dataEnvioFormatada = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    var checklistFormatado = Array.isArray(data.checklist) ? data.checklist.join(", ") : (data.checklist || "");
    
    var novaLinha = [
      dataEnvioFormatada,
      data.dataVistoria || "",
      nomeAutor,
      data.numeroProcesso || "",
      data.reuConcessionaria || "",
      data.numeroVistoria || "1",
      data.periodoVistoria || "",
      data.qtdPessoas || "0",
      data.qtdComodos || "0",
      data.numLampadas || "0",
      data.numTvs || "0",
      data.numVentiladores || "0",
      data.numVentiladoresTeto || "0",
      data.numArCondicionados || "0",
      data.numGeladeiras || "0",
      data.numChuveiros || "0",
      data.numMaquinasLavar || "0",
      data.numFreezers || "0",
      checklistFormatado,
      data.numeroMedidor || "",
      data.medidorChip || "Não",
      data.condicoesMedidor || "Normal",
      data.corteEnergia || "Não",
      data.observacoesMedidor || "",
      data.representacaoAutor || "Presente",
      data.representacaoReu || "Ausente",
      data.observacoesPresenca || "",
      data.observacoesFinais || "",
      urlsFotosImovel.join("\n"),
      urlsFotosMedidor.join("\n"),
      inspectionFolder.getUrl(),
      "" // Link do Laudo PDF (atualizado abaixo se a chave estiver ON)
    ];
    
    sheet.appendRow(novaLinha);
    cache.put(cacheKey, "gravado", 21600);

    // 4. Integração Pré-Vistoria (Lê de "Processos Energia" ou "Pré-Vistoria")
    var urlLaudoGerado = "";
    var sheetProcessosRef = obterAbaProcessosPreVistoria(ss, tipo);
    var dadosPreVistoria = null;
    var linhaProcessoEncontrada = -1;
    var extraido = null;

    if (sheetProcessosRef) {
      extraido = extrairDadosPreVistoriaDinamico(sheetProcessosRef, data.numeroProcesso, nomeAutor);
      if (extraido) {
        dadosPreVistoria = extraido.dados;
        linhaProcessoEncontrada = extraido.linha;
        if (extraido.colunaStatus > 0) {
          sheetProcessosRef.getRange(linhaProcessoEncontrada, extraido.colunaStatus).setValue("Vistoria de Campo Concluída (Gerando Laudo...)");
        }
      }
    }

    // 🚀 CHAVE MESTRE: Dispara compilação automática se ATIVAR_GERACAO_LAUDO_AUTOMATICA = true
    if (CONFIG_AUTOMACAO.ATIVAR_GERACAO_LAUDO_AUTOMATICA) {
      try {
        var payloadCompilacao = {
          processo: dadosPreVistoria || {
            tipoAcao: data.tipoAcao || "Consumo",
            numeroProcesso: data.numeroProcesso,
            nomeAutor: data.nomeAutor,
            nomeReu: data.reuConcessionaria
          },
          vistoria: data,
          returnBase64: true
        };

        var optionsFetch = {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(payloadCompilacao),
          muteHttpExceptions: true
        };

        var respService = UrlFetchApp.fetch(CONFIG_AUTOMACAO.URL_MICROSERVICO_LAUDO + "/api/gerar-laudo-completo", optionsFetch);
        var jsonResp = JSON.parse(respService.getContentText());

        if (jsonResp) {
          var prefixoArquivo = "Laudo_" + (jsonResp.tipoAcao || "Oficial") + "_" + (nomeAutor.replace(/\s+/g, '_'));

          // 1. Salva PDF Oficial no Drive
          if (jsonResp.pdfBase64) {
            var nomePdf = jsonResp.filename || (prefixoArquivo + ".pdf");
            var blobPdf = Utilities.newBlob(Utilities.base64Decode(jsonResp.pdfBase64), "application/pdf", nomePdf);
            var pdfFile = inspectionFolder.createFile(blobPdf);
            urlLaudoGerado = pdfFile.getUrl();

            // Atualiza o link do PDF na planilha de vistorias
            sheet.getRange(sheet.getLastRow(), 32).setValue(urlLaudoGerado);
          }

          // 2. Salva dados.tex no Drive (para edição manual caso necessário)
          if (jsonResp.dadosTex) {
            var blobDadosTex = Utilities.newBlob(jsonResp.dadosTex, "text/plain; charset=utf-8", "dados.tex");
            inspectionFolder.createFile(blobDadosTex);
          }

          // 3. Salva historico_consumo.csv no Drive
          if (jsonResp.historicoCsv) {
            var blobCsv = Utilities.newBlob(jsonResp.historicoCsv, "text/csv; charset=utf-8", "historico_consumo.csv");
            inspectionFolder.createFile(blobCsv);
          }

          // 4. Salva modelo_auto.tex no Drive
          if (jsonResp.modeloAutoTex) {
            var blobModeloTex = Utilities.newBlob(jsonResp.modeloAutoTex, "text/plain; charset=utf-8", "modelo_auto.tex");
            inspectionFolder.createFile(blobModeloTex);
          }

          // Atualiza status e link na aba de Processos se existir
          if (sheetProcessosRef && linhaProcessoEncontrada > 0 && extraido) {
            if (extraido.colunaStatus > 0) {
              sheetProcessosRef.getRange(linhaProcessoEncontrada, extraido.colunaStatus).setValue("Laudo Oficial Gerado ✅");
            }
            if (extraido.colunaLink > 0 && urlLaudoGerado) {
              sheetProcessosRef.getRange(linhaProcessoEncontrada, extraido.colunaLink).setValue(urlLaudoGerado);
            }
          }
        }
      } catch (errLaudo) {
        console.warn("Aviso ao gerar laudo automático:", errLaudo.toString());
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "sucesso",
      message: "Vistoria gravada com sucesso para " + config.nome + "!",
      folderUrl: inspectionFolder.getUrl(),
      laudoUrl: urlLaudoGerado || null,
      perito: config.nome
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "erro",
      message: "Erro interno no script: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

/**
 * =========================================================================
 * FUNÇÕES AUXILIARES DE PRÉ-VISTORIA E FORMATAÇÃO
 * =========================================================================
 */

/**
 * Obtém a aba de Processos / Pré-Vistoria priorizando "Processos Energia", etc.
 */
function obterAbaProcessosPreVistoria(ss, tipo) {
  var tipoLimpo = (tipo || "energia").toLowerCase().trim();
  var mapa = {
    "energia": "Processos Energia",
    "agua": "Processos Água",
    "imobiliario": "Processos Imobiliário",
    "gas": "Processos Gás"
  };
  var nomeDesejado = mapa[tipoLimpo] || ("Processos " + tipoLimpo);
  
  var sheet = buscarAbaFlexivel(ss, nomeDesejado);
  if (sheet) return sheet;

  sheet = buscarAbaFlexivel(ss, "Processos");
  if (sheet) return sheet;

  sheet = buscarAbaFlexivel(ss, "Pré-Vistoria") || buscarAbaFlexivel(ss, "Pre-Vistoria") || buscarAbaFlexivel(ss, "PreVistoria");
  if (sheet) return sheet;

  var allSheets = ss.getSheets();
  for (var i = 0; i < allSheets.length; i++) {
    var n = allSheets[i].getName().toLowerCase();
    if (n.indexOf("processo") !== -1 || n.indexOf("previstoria") !== -1 || n.indexOf("pre-vistoria") !== -1) {
      return allSheets[i];
    }
  }

  return null;
}

function acharIndiceColuna(headersArray, aliases) {
  for (var i = 0; i < headersArray.length; i++) {
    var hLimpo = String(headersArray[i] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    for (var a = 0; a < aliases.length; a++) {
      var aLimpo = aliases[a].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      if (hLimpo === aLimpo || hLimpo.indexOf(aLimpo) !== -1 || aLimpo.indexOf(hLimpo) !== -1) return i;
    }
  }
  return -1;
}

/**
 * Extrai dados da aba de Processos dinamicamente por correspondência flexível de cabeçalhos
 */
function extrairDadosPreVistoriaDinamico(sheetProcessos, numeroProcessoBuscado, nomeAutorBuscado) {
  var dataRange = sheetProcessos.getDataRange().getValues();
  if (dataRange.length <= 1) return null;

  var headers = dataRange[0];

  var colProc = acharIndiceColuna(headers, ["numerodoprocesso", "processo", "numprocesso", "cnj"]);
  var colAutor = acharIndiceColuna(headers, ["nomedoautor", "autor", "parteautora"]);
  var colReu = acharIndiceColuna(headers, ["nomedoreu", "reu", "concessionaria", "empresa"]);
  var colTipo = acharIndiceColuna(headers, ["tipodeacao", "tipoacao", "acao", "objeto"]);
  var colVara = acharIndiceColuna(headers, ["varacomarca", "vara", "juizo", "comarca"]);
  var colCliente = acharIndiceColuna(headers, ["numerodocliente", "cliente", "instalacao", "uc"]);
  var colToi = acharIndiceColuna(headers, ["numerodotoi", "toi", "numtoi"]);
  var colDataToi = acharIndiceColuna(headers, ["datalavraturatoi", "datalavratura"]);
  var colIrreg = acharIndiceColuna(headers, ["irregularidadealegada", "irregularidade", "gato"]);
  var colValRec = acharIndiceColuna(headers, ["valorrecuperacao", "valorrecuperado", "recuperacaoconsumo"]);
  var colEnd = acharIndiceColuna(headers, ["enderecocompleto", "endereco", "local"]);
  var colObj = acharIndiceColuna(headers, ["objetivodapericia", "objetivo", "escopo"]);
  var colResumo = acharIndiceColuna(headers, ["resumodoprocesso", "resumo", "sintese"]);
  var colAleg = acharIndiceColuna(headers, ["alegacoesdoautor", "alegacoesautor", "fatosautor"]);
  var colCont = acharIndiceColuna(headers, ["contestacoesdoreu", "contestacoesreu", "fatosreu"]);
  var colRedIni = acharIndiceColuna(headers, ["inicioreducao", "reducaoinicio"]);
  var colRedFim = acharIndiceColuna(headers, ["fimreducao", "reducaofim"]);
  var colConsMedio = acharIndiceColuna(headers, ["consumomedio", "consumoregular", "mediaregular", "consumomediokwh"]);
  var colConsRecl = acharIndiceColuna(headers, ["consumoreclamado", "consumomedioreclamado", "mediareclamada", "consumoreclamadokwh"]);
  var colHistIni = acharIndiceColuna(headers, ["historicoconsumoinicio", "datainiciohistorico"]);
  var colHistFim = acharIndiceColuna(headers, ["historicoconsumofim", "datafimhistorico"]);
  var colCsv = acharIndiceColuna(headers, ["historicoconsumo", "historicoconsumocsv", "csvconsumo", "csv", "faturas", "leituras"]);
  var colQJuizo = acharIndiceColuna(headers, ["quesitosjuizo", "quesitosdojuizo", "quesitosjuiz"]);
  var colQAutor = acharIndiceColuna(headers, ["quesitosautor", "quesitosdoautor", "quesitosautora"]);
  var colQReu = acharIndiceColuna(headers, ["quesitosreu", "quesitosdoreu", "quesitosconcessionaria"]);
  var colStatus = acharIndiceColuna(headers, ["statusautomacao", "status"]);
  var colLink = acharIndiceColuna(headers, ["linklaudopdf", "laudopdf", "linkpdf", "laudo"]);

  var procBuscadoLimpo = (numeroProcessoBuscado || "").toString().replace(/[^0-9]/g, "");
  var autorBuscadoLimpo = (nomeAutorBuscado || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  var primeiroNomeAutor = autorBuscadoLimpo.split(" ")[0] || "";

  var linhaEscolhida = -1;

  for (var r = 1; r < dataRange.length; r++) {
    var row = dataRange[r];
    var procRow = colProc >= 0 ? String(row[colProc] || "").replace(/[^0-9]/g, "") : "";
    var autorRow = colAutor >= 0 ? String(row[colAutor] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

    var bateuProcesso = (procBuscadoLimpo && procRow && (procBuscadoLimpo === procRow || procRow.indexOf(procBuscadoLimpo) !== -1 || procBuscadoLimpo.indexOf(procRow) !== -1));
    var bateuAutor = (autorBuscadoLimpo && autorRow && (autorBuscadoLimpo.indexOf(autorRow) !== -1 || autorRow.indexOf(autorBuscadoLimpo) !== -1 || (primeiroNomeAutor.length >= 3 && autorRow.indexOf(primeiroNomeAutor) !== -1)));

    if (bateuProcesso || bateuAutor) {
      linhaEscolhida = r;
      break;
    }
  }

  // Se houver apenas 1 registro de dados na planilha e ainda não bateu, usa ele
  if (linhaEscolhida === -1 && dataRange.length === 2) {
    linhaEscolhida = 1;
  }

  if (linhaEscolhida >= 1) {
    var rowTarget = dataRange[linhaEscolhida];
    return {
      linha: linhaEscolhida + 1,
      colunaStatus: colStatus >= 0 ? colStatus + 1 : -1,
      colunaLink: colLink >= 0 ? colLink + 1 : -1,
      dados: {
        tipoAcao: colTipo >= 0 ? String(rowTarget[colTipo] || "Consumo") : "Consumo",
        numeroProcesso: colProc >= 0 ? String(rowTarget[colProc] || "") : (numeroProcessoBuscado || ""),
        nomeAutor: colAutor >= 0 ? String(rowTarget[colAutor] || "") : (nomeAutorBuscado || ""),
        nomeReu: colReu >= 0 ? String(rowTarget[colReu] || "") : "",
        varaJuizo: colVara >= 0 ? String(rowTarget[colVara] || "") : "",
        numeroCliente: colCliente >= 0 ? String(rowTarget[colCliente] || "") : "",
        numeroToi: colToi >= 0 ? String(rowTarget[colToi] || "") : "",
        dataLavraturaToi: colDataToi >= 0 ? String(rowTarget[colDataToi] || "") : "",
        irregularidadeAlegada: colIrreg >= 0 ? String(rowTarget[colIrreg] || "") : "",
        valorRecuperacao: colValRec >= 0 ? String(rowTarget[colValRec] || "") : "",
        enderecoPericia: colEnd >= 0 ? String(rowTarget[colEnd] || "") : "",
        objetivoPericia: colObj >= 0 ? String(rowTarget[colObj] || "") : "",
        resumoProcesso: colResumo >= 0 ? String(rowTarget[colResumo] || "") : "",
        alegacoesAutor: colAleg >= 0 ? String(rowTarget[colAleg] || "") : "",
        contestacoesReu: colCont >= 0 ? String(rowTarget[colCont] || "") : "",
        reducaoMesInicio: colRedIni >= 0 ? String(rowTarget[colRedIni] || "").split("/")[0] : "01",
        reducaoAnoInicio: colRedIni >= 0 ? (String(rowTarget[colRedIni] || "").split("/")[1] || "2024") : "2024",
        reducaoMesFim: colRedFim >= 0 ? String(rowTarget[colRedFim] || "").split("/")[0] : "12",
        reducaoAnoFim: colRedFim >= 0 ? (String(rowTarget[colRedFim] || "").split("/")[1] || "2024") : "2024",
        consumoMedio: colConsMedio >= 0 ? String(rowTarget[colConsMedio] || "") : "",
        consumoMedioReclamado: colConsRecl >= 0 ? String(rowTarget[colConsRecl] || "") : "",
        historicoConsumoInicio: colHistIni >= 0 ? String(rowTarget[colHistIni] || "") : "",
        historicoConsumoFim: colHistFim >= 0 ? String(rowTarget[colHistFim] || "") : "",
        historicoConsumoCsv: colCsv >= 0 ? String(rowTarget[colCsv] || "") : "",
        quesitosJuizo: colQJuizo >= 0 ? String(rowTarget[colQJuizo] || "") : "",
        quesitosAutor: colQAutor >= 0 ? String(rowTarget[colQAutor] || "") : "",
        quesitosReu: colQReu >= 0 ? String(rowTarget[colQReu] || "") : ""
      }
    };
  }

  return null;
}

function buscarAbaFlexivel(ss, nomeDesejado) {
  var sheets = ss.getSheets();
  var alvoLimpo = String(nomeDesejado || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  for (var i = 0; i < sheets.length; i++) {
    var nomeAbaLimpo = String(sheets[i].getName() || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (nomeAbaLimpo === alvoLimpo || nomeAbaLimpo.indexOf(alvoLimpo) !== -1 || alvoLimpo.indexOf(nomeAbaLimpo) !== -1) {
      return sheets[i];
    }
  }
  return null;
}

function criarOuObterPasta(parentFolder, nomePasta) {
  var pastas = parentFolder.getFoldersByName(nomePasta);
  if (pastas.hasNext()) return pastas.next();
  return parentFolder.createFolder(nomePasta);
}

function salvarFotosBase64(photosArray, targetFolder, prefixo) {
  var urls = [];
  for (var i = 0; i < photosArray.length; i++) {
    try {
      var photo = photosArray[i];
      var base64Data = photo.base64 || photo.pdfBase64 || "";
      if (typeof base64Data === "string") {
        base64Data = base64Data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
      }
      if (!base64Data) continue;
      
      var numSeq = (i + 1) < 10 ? "0" + (i + 1) : "" + (i + 1);
      var extensao = (photo.name && photo.name.indexOf(".") !== -1) ? photo.name.split(".").pop() : "jpeg";
      var nomeArquivo = prefixo + numSeq + "." + extensao;
      
      var decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), "image/" + extensao, nomeArquivo);
      var file = targetFolder.createFile(decodedBlob);
      urls.push(file.getUrl());
    } catch (err) {
      console.warn("Erro ao salvar foto " + i + ": " + err.toString());
    }
  }
  return urls;
}

function isRegistroDuplicado(sheet, numeroProcesso, nomeAutor, dataVistoria) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  var numLinhasVerificar = Math.min(lastRow - 1, 30);
  var startRow = lastRow - numLinhasVerificar + 1;
  var data = sheet.getRange(startRow, 1, numLinhasVerificar, 4).getValues();
  
  var procLimpo = numeroProcesso ? numeroProcesso.toString().replace(/[^0-9]/g, "") : "";
  var autorLimpo = nomeAutor ? nomeAutor.toString().toLowerCase().trim() : "";
  
  for (var i = data.length - 1; i >= 0; i--) {
    var rowAutor = data[i][2] ? data[i][2].toString().toLowerCase().trim() : "";
    var rowProc = data[i][3] ? data[i][3].toString().replace(/[^0-9]/g, "") : "";
    if (procLimpo && rowProc && procLimpo === rowProc) return true;
    if (autorLimpo && rowAutor && autorLimpo === rowAutor) {
      if (dataVistoria && data[i][1]) {
        var rowDataVistoria = data[i][1].toString();
        if (rowDataVistoria.indexOf(dataVistoria) !== -1) return true;
      }
    }
  }
  return false;
}

function capitalizarNome(texto) {
  if (!texto) return "";
  var preposicoes = ["de", "da", "do", "das", "dos", "e"];
  return texto.toString().toLowerCase().split(" ").map(function(palavra, index) {
    if (palavra.length === 0) return "";
    if (index > 0 && preposicoes.indexOf(palavra) !== -1) return palavra;
    return palavra.charAt(0).toUpperCase() + palavra.slice(1);
  }).join(" ").trim();
}
