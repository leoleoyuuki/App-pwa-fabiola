/**
 * =========================================================================
 * VISTORIAPRO - GOOGLE APPS SCRIPT MULTI-PERITO (COMPLETO)
 * =========================================================================
 * Contempla:
 *  - Roteamento inteligente por perito (Rodrigues e Leo K.)
 *  - Validação de e-mail cadastrado com diagnóstico claro
 *  - Dupla camada anti-duplicidade (Cache do Google + Verificação das últimas 30 linhas)
 *  - Tratamento inteligente de datas (Data de Envio com HH:mm:ss e Data da Vistoria limpa)
 *  - Busca flexível de abas ("Processos Energia", "Processos Água", etc.)
 *  - Criação e formatação automática de cabeçalhos
 *  - Organização de pastas (Imovel/ e Medidor/) com numeração sequencial
 *  - Integração opcional com Vercel LaTeX & PDF
 */

// 👥 TABELA CENTRAL DE CONFIGURAÇÃO DE PERITOS
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
 * 1. GET REQUESTS: Busca de Processos Agendados e Histórico de Laudos
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
    
    var mapaAbasProcessos = {
      "energia": "Processos Energia",
      "agua": "Processos Água",
      "imobiliario": "Processos Imobiliário",
      "gas": "Processos Gás"
    };
    
    var nomeAbaProcessos = mapaAbasProcessos[tipo] || "Processos Energia";
    
    // CASO 1: Busca a lista de Processos Agendados para o formulário
    if (action === "processos") {
      var sheetProcessos = buscarAbaFlexivel(ss, nomeAbaProcessos);
      
      if (!sheetProcessos) {
        sheetProcessos = ss.insertSheet(nomeAbaProcessos);
        sheetProcessos.appendRow(["Data da Vistoria", "Nome do Autor", "Número do Processo", "Réu / Concessionária"]);
        sheetProcessos.autoResizeColumns(1, 4);
      }
      
      var dataProcessos = sheetProcessos.getDataRange().getValues();
      if (dataProcessos.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify([]))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var arrayProcessos = [];
      for (var i = 1; i < dataProcessos.length; i++) {
        var row = dataProcessos[i];
        if (!row[0] && !row[1] && !row[2]) continue; 
        
        var dataVistoriaVal = row[0];
        if (dataVistoriaVal instanceof Date) {
          dataVistoriaVal = Utilities.formatDate(dataVistoriaVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else if (dataVistoriaVal) {
          dataVistoriaVal = dataVistoriaVal.toString().trim();
        } else {
          dataVistoriaVal = "";
        }
        
        arrayProcessos.push({
          dataVistoria: dataVistoriaVal,
          nomeAutor: row[1] ? row[1].toString().trim() : "",
          numeroProcesso: row[2] ? row[2].toString().trim() : "",
          reuConcessionaria: row[3] ? row[3].toString().trim() : ""
        });
      }
      
      return ContentService.createTextOutput(JSON.stringify(arrayProcessos))
        .setMimeType(ContentService.MimeType.JSON);
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
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheetLaudos.getDataRange().getValues();
    var headers = data[0];
    var jsonArray = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var record = {};
      
      for (var j = 0; j < headers.length; j++) {
        var value = row[j];
        var headerName = headers[j].toString().trim();
        var keyName = headerName.replace(/\s+/g, '');
        
        if (value instanceof Date) {
          // Se for a coluna Data de Envio: formata com data e horário real
          if (j === 0 || keyName === "DatadeEnvio") {
            value = Utilities.formatDate(value, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
          } else {
            // Outras datas (como Data da Vistoria): formata apenas como data
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
        record[keyName] = value;
      }
      jsonArray.push(record);
    }
    
    return ContentService.createTextOutput(JSON.stringify(jsonArray))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * =========================================================================
 * 2. POST REQUESTS: Gravação de Vistoria, Fotos no Drive e Planilha
 * =========================================================================
 */
function doPost(e) {
  // 🔒 TRAVA ATÔMICA EXCLUSIVA (Evita concorrência e gravações paralelas)
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
    
    // 👥 2.1 Identificação e Roteamento do Perito
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
    
    var tipo = (data.tipoAcao || data.tipoInspecao || "energia").toLowerCase().trim();
    var ATIVAR_GERACAO_LAUDO_LATEX = false;
    
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
        dataVistoriaFormatada = partesDate[2] + "-" + partesDate[1] + "-" + partesDate[0].substring(2);
      }
    } else {
      dataVistoriaFormatada = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MM-yy");
    }
    
    var folderName = (data.numeroVistoria || "1") + " - " + nomeAutor + " - " + dataVistoriaFormatada;
    
    var subFolder;
    var folders = mainFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      subFolder = folders.next();
    } else {
      subFolder = mainFolder.createFolder(folderName);
    }
    
    var imovelFolder = getOrCreateSubFolder(subFolder, "Imovel");
    var medidorFolder = getOrCreateSubFolder(subFolder, "Medidor");
    
    // 2. Salva as fotos em resolução original no Google Drive
    if (data.photosImovel && data.photosImovel.length > 0) {
      for (var i = 0; i < data.photosImovel.length; i++) {
        var photo = data.photosImovel[i];
        var base64Data = (photo.base64 || "").replace(/^data:image\/\w+;base64,/, "");
        var ext = (photo.name || "foto.jpeg").split('.').pop() || "jpeg";
        var seqNum = (i + 1) < 10 ? "0" + (i + 1) : (i + 1);
        var filename = "Imovel_" + seqNum + "." + ext;
        
        var existingFiles = imovelFolder.getFilesByName(filename);
        if (!existingFiles.hasNext()) {
          var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "image/" + ext, filename);
          imovelFolder.createFile(blob);
        }
      }
    }
    
    if (data.photosMedidor && data.photosMedidor.length > 0) {
      for (var j = 0; j < data.photosMedidor.length; j++) {
        var photo = data.photosMedidor[j];
        var base64Data = (photo.base64 || "").replace(/^data:image\/\w+;base64,/, "");
        var ext = (photo.name || "foto.jpeg").split('.').pop() || "jpeg";
        var seqNum = (j + 1) < 10 ? "0" + (j + 1) : (j + 1);
        var filename = "Medidor_" + seqNum + "." + ext;
        
        var existingFilesMed = medidorFolder.getFilesByName(filename);
        if (!existingFilesMed.hasNext()) {
          var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), "image/" + ext, filename);
          medidorFolder.createFile(blob);
        }
      }
    }
    
    // 3. Grava os registros na planilha do Perito com PROTEÇÃO ANTI-DUPLICIDADE
    var ss = SpreadsheetApp.openById(spreadsheetId);
    
    var mapaAbasLaudos = {
      "energia": "Energia",
      "agua": "Água",
      "imobiliario": "Imobiliário",
      "gas": "Gás"
    };
    
    var nomeAbaDestino = mapaAbasLaudos[tipo] || "Energia";
    var sheet = buscarAbaFlexivel(ss, nomeAbaDestino) || ss.getSheets()[0];
    
    var headers = [
      "Data de Envio", "Nome do Autor", "Número do Processo", "Réu / Concessionária", 
      "Tipo de Ação", "Data da Vistoria", "Nº da Vistoria", "Período da Vistoria",
      "Representação Autor Presente?", "Representação Réu Presente?", "Obs. Presença das Partes",
      "Número do Medidor", "Medidor com Chip?", "Condições do Medidor", "Corte de Energia?",
      "Pessoas Residentes", "Quantidade de Cômodos", "Nº de Lâmpadas", "Nº de TVs", 
      "Nº de Ventiladores", "Nº de Ventiladores de Teto", "Nº de Ar Condicionados", 
      "Nº de Geladeiras", "Nº de Chuveiros Elétricos", "Nº de Máquinas de Lavar", 
      "Nº de Freezers", "Checklist Técnico", "Observações Finais do Perito", "Link da Pasta (Google Drive)"
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#F3F3F3");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    var checklistTexto = "";
    if (Array.isArray(data.checklist)) {
      checklistTexto = data.checklist.join(", ");
    } else if (data.checklist) {
      checklistTexto = String(data.checklist);
    }
    
    // 🛡️ CAMADA 2: Verificação de duplicidade nas últimas 30 linhas da planilha
    var rowsExistentes = sheet.getDataRange().getValues();
    var jaExisteNaPlanilha = false;
    var startIdx = Math.max(1, rowsExistentes.length - 30);
    
    for (var r = startIdx; r < rowsExistentes.length; r++) {
      var rowAutor = String(rowsExistentes[r][1] || "").toLowerCase().trim();
      var rowProc = String(rowsExistentes[r][2] || "").trim();
      var rowDataVistoria = String(rowsExistentes[r][5] || "").trim();
      
      if (rowAutor === nomeAutor.toLowerCase().trim() && 
          rowProc === String(data.numeroProcesso || "").trim() && 
          rowDataVistoria === String(data.dataVistoria || "").trim()) {
        jaExisteNaPlanilha = true;
        break;
      }
    }
    
    // Só insere se não for duplicado
    if (!jaExisteNaPlanilha) {
      sheet.appendRow([
        new Date(),
        nomeAutor,
        String(data.numeroProcesso || ""),
        String(data.reuConcessionaria || ""),
        String(data.tipoAcao || "Consumo"),
        String(data.dataVistoria || ""),
        String(data.numeroVistoria || "1"),
        String(data.periodoVistoria || ""),
        String(data.representacaoAutor || "Sim"),
        String(data.representacaoReu || "Sim"),
        String(data.observacoesPresenca || ""),
        String(data.numeroMedidor || ""),
        String(data.medidorChip || "Não"),
        String(data.condicoesMedidor || ""),
        String(data.corteEnergia || "Não"),
        String(data.qtdPessoas || ""),
        String(data.qtdComodos || ""),
        String(data.numLampadas || ""),
        String(data.numTvs || "0"),
        String(data.numVentiladores || "0"),
        String(data.numVentiladoresTeto || "0"),
        String(data.numArCondicionados || "0"),
        String(data.numGeladeiras || "0"),
        String(data.numChuveiros || "0"),
        String(data.numMaquinasLavar || "0"),
        String(data.numFreezers || "0"),
        checklistTexto,
        String(data.observacoesFinais || ""),
        subFolder.getUrl()
      ]);
    }
    
    // 4. GERAÇÃO DO LAUDO PDF E LATEX VIA VERCEL (SE ATIVADO)
    if (ATIVAR_GERACAO_LAUDO_LATEX) {
      try {
        var payloadVercel = JSON.parse(JSON.stringify(data));
        
        if (payloadVercel.photosImovel) {
          payloadVercel.photosImovel = payloadVercel.photosImovel.map(function(p) {
            return { name: p.name, base64: p.pdfBase64 || p.base64 };
          });
        }
        if (payloadVercel.photosMedidor) {
          payloadVercel.photosMedidor = payloadVercel.photosMedidor.map(function(p) {
            return { name: p.name, base64: p.pdfBase64 || p.base64 };
          });
        }

        var vercelUrl = "https://automacao-latex.vercel.app/gerar-laudo?format=base64";
        var options = {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(payloadVercel),
          muteHttpExceptions: true
        };

        var response = UrlFetchApp.fetch(vercelUrl, options);
        var resJson = JSON.parse(response.getContentText());

        if (resJson && resJson.pdfBase64) {
          var pdfBlob = Utilities.newBlob(
            Utilities.base64Decode(resJson.pdfBase64), 
            "application/pdf", 
            "Laudo_Pericial_" + (data.numeroVistoria || "1") + "_" + nomeAutor.replace(/\s+/g, '_') + ".pdf"
          );
          subFolder.createFile(pdfBlob);
        }
        
        if (resJson && resJson.texContent) {
          var texBlob = Utilities.newBlob(
            resJson.texContent,
            "text/plain",
            "Laudo_Pericial_" + (data.numeroVistoria || "1") + "_" + nomeAutor.replace(/\s+/g, '_') + ".tex"
          );
          subFolder.createFile(texBlob);
        }

      } catch (latexError) {
        Logger.log("Aviso: Falha ao compilar laudo na Vercel: " + latexError);
      }
    }
    
    cache.put(cacheKey, "concluido", 21600);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "sucesso", 
      message: "Relatório gravado e fotos salvas com sucesso para o perito " + config.nome + "!",
      perito: config.nome,
      folderUrl: subFolder.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "erro", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function buscarAbaFlexivel(ss, nomeAlvo) {
  var sheets = ss.getSheets();
  var alvoLimpo = nomeAlvo.toLowerCase().replace(/\s+/g, '');
  for (var i = 0; i < sheets.length; i++) {
    var nomeAba = sheets[i].getName().toLowerCase().replace(/\s+/g, '');
    if (nomeAba === alvoLimpo) {
      return sheets[i];
    }
  }
  return null;
}

function capitalizarNome(nome) {
  if (!nome) return "";
  return nome
    .toLowerCase()
    .split(" ")
    .map(function(p) {
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(" ");
}

function getOrCreateSubFolder(parentFolder, name) {
  var folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(name);
  }
}
