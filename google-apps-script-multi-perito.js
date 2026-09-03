/**
 * =========================================================================
 * VISTORIAPRO - BACKEND GOOGLE APPS SCRIPT MULTI-PERITO ENTERPRISE
 * Com Mapeamento Dinâmico Inteligente de 30 Colunas e Integração LaTeX Oficial
 * =========================================================================
 */

// 1. DICIONÁRIO MULTI-PERITO
var PERITOS_CONFIG = {
  "rodrigues.periciajud@gmail.com": {
    nome: "Fabíola Rodrigues Costa",
    tituloLinhaA: "Arquiteta e Urbanista - Perita Judicial",
    tituloLinhaB: "Especialista em Consumo, Avaliações de Imóveis e Danos na Construção Civil",
    registroRotulo: "CAU-RJ",
    registroNumero: "A237493-5",
    telefone: "(021) 97779-5665",
    email: "rodrigues.periciajud@gmail.com",
    spreadsheetId: "1APnRdpsxg6ufg_xBZjmvruSGf2hrrXYlrrlJwfBLyOk",
    mainFolderId: "1dIFg4HCfX0C3cG_8WrbFK5PHETt6VUQV"
  },
  "leok.perito@gmail.com": {
    nome: "Leonardo K.",
    tituloLinhaA: "Engenheiro Eletricista - Perito Judicial",
    tituloLinhaB: "Especialista em Engenharia Diagnóstica e Perícias Judiciais",
    registroRotulo: "CREA-RJ",
    registroNumero: "2024-XXXX",
    telefone: "(021) 99999-9999",
    email: "leok.perito@gmail.com",
    spreadsheetId: "1dC4Yn6XSmEOBBraiTAWUMqUuYzmpZkXx84Ert6fgZcA",
    mainFolderId: "1O-9Xu0tLGZBjmFY8YkL0jzPy2vS6KFR7"
  },
  "leoyuuki@dev.com": {
    nome: "Leonardo Yuuki (Ambiente de Testes / Dev)",
    tituloLinhaA: "Engenheiro de Software & Perito Técnico",
    tituloLinhaB: "Desenvolvimento e Testes de Automação Pericial",
    registroRotulo: "CREA/DEV",
    registroNumero: "DEV-1001",
    telefone: "(021) 98888-8888",
    email: "leoyuuki@dev.com",
    spreadsheetId: "1FN7kF425xtjcwKN7_IXChw1mw5Qkt4vfEKW_vs8s-jg",
    mainFolderId: "1utF69gWlshwlHfQUXxQ8gskLC8bRo4e0"
  }
};

var PERITO_PADRAO_EMAIL = "rodrigues.periciajud@gmail.com";
var MICROSERVICE_LATEX_BASE_URL = "https://automacao-latex.vercel.app";
var ATIVAR_GERACAO_LAUDO_LATEX = true;

/**
 * =========================================================================
 * ENDPOINT GET: Sincronização de Processos Pré-Vistoria (Processos Energia)
 * =========================================================================
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var peritoEmail = (params.peritoEmail || params.perito || PERITO_PADRAO_EMAIL).toLowerCase().trim();
    var config = PERITOS_CONFIG[peritoEmail] || PERITOS_CONFIG[PERITO_PADRAO_EMAIL];
    
    var spreadsheetId = config.spreadsheetId;
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var action = (params.action || "").toLowerCase().trim();

    // 1. AÇÃO: Processos Pré-Vistoria (Aba "Processos Energia")
    if (action === "processos" || action === "previstoria" || action === "agenda") {
      var sheetProcessos = buscarAbaFlexivel(ss, "Processos Energia") || buscarAbaFlexivel(ss, "Processos") || buscarAbaFlexivel(ss, "Pré-Vistoria");
      
      var processos = [];
      if (sheetProcessos) {
        var dataProcessos = sheetProcessos.getDataRange().getDisplayValues();
        if (dataProcessos.length > 1) {
          var headers = dataProcessos[0];
          
          var colTipo = acharIndiceColuna(headers, ["tipodeacaoconsumotoi", "tipodeacao", "tipoacao", "acao"]);
          var colProc = acharIndiceColuna(headers, ["numerodoprocessocnj", "numerodoprocesso", "processo", "numprocesso", "cnj"]);
          var colAutor = acharIndiceColuna(headers, ["nomedoautor", "autor", "parteautora"]);
          var colReu = acharIndiceColuna(headers, ["nomedoreu", "reu", "concessionaria", "empresa"]);
          var colVara = acharIndiceColuna(headers, ["varacomarca", "vara", "juizo", "comarca"]);
          var colCliente = acharIndiceColuna(headers, ["numerodoclienteinstalacao", "numerodocliente", "cliente", "instalacao", "uc"]);
          var colToi = acharIndiceColuna(headers, ["numerodotoi", "toi", "numtoi"]);
          var colDataToi = acharIndiceColuna(headers, ["datalavraturatoi", "datalavratura"]);
          var colIrreg = acharIndiceColuna(headers, ["irregularidadealegadagatodesvio", "irregularidadealegada", "irregularidade", "gato"]);
          var colValRec = acharIndiceColuna(headers, ["valorderecuperacaocobrador", "valorrecuperacao", "valorrecuperado"]);
          var colEnd = acharIndiceColuna(headers, ["enderecocompletodapericia", "enderecocompleto", "endereco", "local"]);
          var colObj = acharIndiceColuna(headers, ["objetivodapericia", "objetivo", "escopo"]);
          var colResumo = acharIndiceColuna(headers, ["resumodoprocesso", "resumo", "sintese"]);
          var colAleg = acharIndiceColuna(headers, ["alegacoesdoautorformatadocom", "alegacoesdoautor", "alegacoesautor"]);
          var colCont = acharIndiceColuna(headers, ["contestacoesdoreuformatadocom", "contestacoesdoreu", "contestacoesreu"]);
          var colRedIni = acharIndiceColuna(headers, ["inicioperiodocontrovertidomesano", "inicioreducao", "reducaoinicio"]);
          var colRedFim = acharIndiceColuna(headers, ["fimperiodocontrovertidomesano", "fimreducao", "reducaofim"]);
          var colConsMedio = acharIndiceColuna(headers, ["consumomedioregularkwh", "consumomedio", "mediaregular"]);
          var colConsRecl = acharIndiceColuna(headers, ["consumomedioreclamadokwh", "consumoreclamado", "mediareclamada"]);
          var colHistIni = acharIndiceColuna(headers, ["datainiciohistoricofaturas", "iniciofaturas", "faturasinicio"]);
          var colHistFim = acharIndiceColuna(headers, ["datafimhistoricofaturas", "fimfaturas", "faturasfim"]);
          var colCsv = acharIndiceColuna(headers, ["historicodeconsumocsvmultilinha", "historicodeconsumo", "historicocsv", "csv"]);
          var colQJuizo = acharIndiceColuna(headers, ["quesitosdojuizobrutos", "quesitosdojuizo", "quesitosjuizo"]);
          var colQAutor = acharIndiceColuna(headers, ["quesitosdoautorbrutos", "quesitosdoautor", "quesitosautor"]);
          var colQReu = acharIndiceColuna(headers, ["quesitosdoreubrutos", "quesitosdoreu", "quesitosreu"]);
          var colStatus = acharIndiceColuna(headers, ["statusdaautomacao", "status", "situacao"]);
          
          for (var i = 1; i < dataProcessos.length; i++) {
            var row = dataProcessos[i];
            var numProcVal = colProc >= 0 ? String(row[colProc] || "").trim() : "";
            var autorVal = colAutor >= 0 ? String(row[colAutor] || "").trim() : "";
            
            if (!numProcVal && !autorVal) continue;
            
            processos.push({
              linhaIndex: i + 1,
              tipoAcao: colTipo >= 0 ? String(row[colTipo] || "Consumo") : "Consumo",
              numeroProcesso: numProcVal,
              nomeAutor: autorVal,
              nomeReu: colReu >= 0 ? String(row[colReu] || "") : "",
              varaJuizo: colVara >= 0 ? String(row[colVara] || "") : "",
              numeroCliente: colCliente >= 0 ? String(row[colCliente] || "") : "",
              numeroToi: colToi >= 0 ? String(row[colToi] || "") : "",
              dataLavraturaToi: colDataToi >= 0 ? String(row[colDataToi] || "") : "",
              irregularidadeAlegada: colIrreg >= 0 ? String(row[colIrreg] || "") : "",
              valorRecuperacao: colValRec >= 0 ? String(row[colValRec] || "") : "",
              enderecoPericia: colEnd >= 0 ? String(row[colEnd] || "") : "",
              objetivoPericia: colObj >= 0 ? String(row[colObj] || "") : "",
              resumoProcesso: colResumo >= 0 ? String(row[colResumo] || "") : "",
              alegacoesAutor: colAleg >= 0 ? String(row[colAleg] || "") : "",
              contestacoesReu: colCont >= 0 ? String(row[colCont] || "") : "",
              reducaoMesInicio: colRedIni >= 0 ? String(row[colRedIni] || "").split("/")[0] : "01",
              reducaoAnoInicio: colRedIni >= 0 ? (String(row[colRedIni] || "").split("/")[1] || "2024") : "2024",
              reducaoMesFim: colRedFim >= 0 ? String(row[colRedFim] || "").split("/")[0] : "12",
              reducaoAnoFim: colRedFim >= 0 ? (String(row[colRedFim] || "").split("/")[1] || "2024") : "2024",
              consumoMedio: colConsMedio >= 0 ? String(row[colConsMedio] || "") : "",
              consumoMedioReclamado: colConsRecl >= 0 ? String(row[colConsRecl] || "") : "",
              historicoConsumoInicio: colHistIni >= 0 ? String(row[colHistIni] || "") : "",
              historicoConsumoFim: colHistFim >= 0 ? String(row[colHistFim] || "") : "",
              historicoConsumoCsv: colCsv >= 0 ? String(row[colCsv] || "") : "",
              quesitosJuizo: colQJuizo >= 0 ? String(row[colQJuizo] || "") : "",
              quesitosAutor: colQAutor >= 0 ? String(row[colQAutor] || "") : "",
              quesitosReu: colQReu >= 0 ? String(row[colQReu] || "") : "",
              statusAutomacao: colStatus >= 0 ? String(row[colStatus] || "") : "Pendente"
            });
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify(processos)).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. PADRÃO / AÇÃO: Relatórios Enviados (Aba "Energia") para a aba "Relatórios Enviados" (CloudHistory)
    var sheetEnergia = buscarAbaFlexivel(ss, "Energia") || ss.getSheets()[0];
    var relatorios = [];
    if (sheetEnergia) {
      var dataEnergia = sheetEnergia.getDataRange().getDisplayValues();
      if (dataEnergia.length > 1) {
        var headersE = dataEnergia[0];

        for (var r = 1; r < dataEnergia.length; r++) {
          var linha = dataEnergia[r];
          var item = {};
          var temDado = false;
          for (var c = 0; c < headersE.length; c++) {
            var headerOriginal = String(headersE[c] || "").trim();
            if (!headerOriginal) continue;
            var val = linha[c] || "";
            if (val) temDado = true;

            // 1. Chave exata do cabeçalho original da planilha
            item[headerOriginal] = val;

            // 2. Chave sem espaços preservando acentos: "Número do Processo" -> "NúmerodoProcesso"
            var chaveSemEspacos = headerOriginal.replace(/\s+/g, "");
            item[chaveSemEspacos] = val;

            // 3. Chave sem barras/pontos/interrogação: "Réu / Concessionária" -> "RéuConcessionária"
            var chaveLimpa = chaveSemEspacos.replace(/[\/\.\?]/g, "");
            item[chaveLimpa] = val;

            // 4. Chave normalizada em minúsculas sem acentos: "numerodoprocesso"
            var chaveNorm = headerOriginal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
            if (chaveNorm) {
              item[chaveNorm] = val;
            }
          }
          if (temDado) {
            relatorios.push(item);
          }
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify(relatorios)).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "erro",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * =========================================================================
 * ENDPOINT POST: Gravação de Vistorias + Automação de Laudo Oficial
 * =========================================================================
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "erro", 
      message: "O servidor está ocupado processando outro laudo. Tente novamente em alguns segundos." 
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "erro", 
        message: "Nenhum dado recebido no corpo da requisição." 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var peritoEmail = (data.peritoEmail || PERITO_PADRAO_EMAIL).toLowerCase().trim();
    var config = PERITOS_CONFIG[peritoEmail] || PERITOS_CONFIG[PERITO_PADRAO_EMAIL];

    var mainFolderId = config.mainFolderId;
    var spreadsheetId = config.spreadsheetId;
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var tipo = (data.tipoAcao || data.tipoInspecao || "energia").toLowerCase().trim();

    var nomeAutorOriginal = data.nomeAutor || "Autor Sem Nome";
    var nomeAutor = capitalizarNome(nomeAutorOriginal);
    
    // 🛡️ CAMADA 1: PREVENÇÃO CONTRA DUPLO CLIQUE ACIDENTAL (20 segundos)
    var cache = CacheService.getScriptCache();
    var idInspecao = data.id ? String(data.id) : (nomeAutor + "_" + (data.numeroProcesso || "") + "_" + (data.dataVistoria || ""));
    var cacheKey = "proc_" + idInspecao.replace(/[^a-zA-Z0-9_]/g, "");

    if (cache.get(cacheKey) === "processando") {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "sucesso", 
        message: "Uma requisição idêntica já está sendo processada no momento.",
        perito: config.nome,
        duplicatePrevented: true
      })).setMimeType(ContentService.MimeType.JSON);
    }
    cache.put(cacheKey, "processando", 20);
    
    // 1. Cria nova pasta no Google Drive do Perito com versionamento (NÃO sobrescreve nem apaga vistorias anteriores)
    var mainFolder = DriveApp.getFolderById(mainFolderId);
    
    var dataVistoriaFormatada = "";
    if (data.dataVistoria) {
      var partesDate = data.dataVistoria.toString().split("-");
      if (partesDate.length === 3) {
        dataVistoriaFormatada = partesDate[2] + "-" + partesDate[1] + "-" + partesDate[0];
      } else {
        dataVistoriaFormatada = data.dataVistoria.toString().split("/").join("-");
      }
    }
    
    var pastaVistoriaNome = dataVistoriaFormatada ? (dataVistoriaFormatada + " - " + nomeAutor) : nomeAutor;
    var inspectionFolder = criarPastaVistoriaComVersionamento(mainFolder, pastaVistoriaNome);
    
    var subfolderImovel = criarOuObterPasta(inspectionFolder, "Fotos da Residência");
    var subfolderMedidor = criarOuObterPasta(inspectionFolder, "Fotos do Medidor");
    
    // 2. Salva Fotografias em Base64
    var urlsFotosImovel = [];
    if (data.photosImovel && Array.isArray(data.photosImovel)) {
      urlsFotosImovel = salvarFotosBase64(data.photosImovel, subfolderImovel, "Imovel_");
    }
    
    var urlsFotosMedidor = [];
    if (data.photosMedidor && Array.isArray(data.photosMedidor)) {
      urlsFotosMedidor = salvarFotosBase64(data.photosMedidor, subfolderMedidor, "Medidor_");
    }
    
    // 3. Gravação na Planilha de Vistorias na aba "Energia" (Relatórios)
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
    }
    
    // 🛡️ CAMADA 2: IDENTIFICAÇÃO DE VISTORIA REPETIDA / REENVIADA
    // Se o processo já existir, NÃO bloqueia o microserviço: gera nova linha, nova pasta e novo Laudo Oficial!
    var ehReenvio = isRegistroDuplicado(sheet, data.numeroProcesso, nomeAutor, data.dataVistoria);
    if (ehReenvio) {
      console.log("ℹ️ Vistoria repetida/reenviada detectada para o processo " + data.numeroProcesso + ". Gerando nova pasta isolada e novo Laudo no microserviço.");
    }
    
    // Gravação 100% DINÂMICA na planilha
    var linhaGravadaIndex = gravarLinhaVistoriaDinamica(sheet, data, nomeAutor, inspectionFolder.getUrl(), "");

    // 4. Integração Pré-Vistoria: Lê estritamente de "Processos Energia"
    var urlLaudoGerado = "";
    var mapaProcessosAba = {
      "energia": "Processos Energia",
      "agua": "Processos Água",
      "imobiliario": "Processos Imobiliário",
      "gas": "Processos Gás"
    };
    var nomeAbaProcAlvo = mapaProcessosAba[tipo] || "Processos Energia";
    var sheetProcessosRef = buscarAbaFlexivel(ss, nomeAbaProcAlvo) || buscarAbaFlexivel(ss, "Processos") || buscarAbaFlexivel(ss, "Pré-Vistoria");
    
    var dadosPreVistoria = null;
    var linhaProcessoEncontrada = -1;
    
    if (sheetProcessosRef) {
      var extraido = extrairDadosPreVistoriaDinamico(sheetProcessosRef, data.numeroProcesso, nomeAutor);
      if (extraido) {
        dadosPreVistoria = extraido.dados;
        linhaProcessoEncontrada = extraido.linhaIndex;
      }
    }

    // 5. Automação do Laudo LaTeX Oficial via Microserviço Vercel (Pipeline em 2 Etapas sem Timeout)
    if (ATIVAR_GERACAO_LAUDO_LATEX) {
      try {
        var dadosProcesso = Object.assign({
          peritoNome: config.nome,
          peritoTituloLinhaA: config.tituloLinhaA,
          peritoTituloLinhaB: config.tituloLinhaB,
          peritoRegistroRotulo: config.registroRotulo,
          peritoRegistroNumero: config.registroNumero,
          peritoTelefone: config.telefone,
          peritoEmail: config.email,
          nomeAutor: nomeAutor,
          numeroProcesso: data.numeroProcesso || "",
          reuConcessionaria: data.reuConcessionaria || "",
          tipoAcao: data.tipoAcao || "Consumo"
        }, dadosPreVistoria || {});

        var dadosVistoria = {
          dataVistoria: data.dataVistoria || "",
          numeroVistoria: data.numeroVistoria || "1",
          periodoVistoria: data.periodoVistoria || "",
          qtdPessoas: data.qtdPessoas || "1",
          qtdComodos: data.qtdComodos || "1",
          numLampadas: data.numLampadas || "0",
          numTvs: data.numTvs || "0",
          numVentiladores: data.numVentiladores || "0",
          numVentiladoresTeto: data.numVentiladoresTeto || "0",
          numArCondicionados: data.numArCondicionados || "0",
          numGeladeiras: data.numGeladeiras || "0",
          numChuveiros: data.numChuveiros || "0",
          numMaquinasLavar: data.numMaquinasLavar || "0",
          numFreezers: data.numFreezers || "0",
          checklist: data.checklist || [],
          numeroMedidor: data.numeroMedidor || "",
          medidorChip: data.medidorChip || "Não",
          condicoesMedidor: data.condicoesMedidor || "Boa (Lacrado)",
          corteEnergia: data.corteEnergia || "Não",
          observacoesMedidor: data.observacoesMedidor || "",
          representacaoAutor: data.representacaoAutor || "Presente",
          representacaoReu: data.representacaoReu || "Ausente",
          observacoesPresenca: data.observacoesPresenca || "",
          observacoesFinais: data.observacoesFinais || "",
          photosImovel: data.photosImovel || [],
          photosMedidor: data.photosMedidor || []
        };

        // --- ETAPA 1: IA Gemini redige as respostas e prepara arquivos .TeX / .CSV (~6 a 12s) ---
        var respostasQuesitos = {
          quesitosDoJuizo: "\\textbf{Quesitos do Juízo:} Aguardando manifestação técnica.",
          quesitosDoAutor: "\\textbf{Quesitos do Autor:} Aguardando manifestação técnica.",
          quesitosDoReu: "\\textbf{Quesitos do Réu:} Aguardando manifestação técnica."
        };

        try {
          var payloadQuesitos = {
            processo: dadosProcesso,
            vistoria: dadosVistoria
          };
          var respQuesitosHttp = UrlFetchApp.fetch(MICROSERVICE_LATEX_BASE_URL + "/api/responder-quesitos", {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(payloadQuesitos),
            muteHttpExceptions: true
          });
          var jsonQuesitos = JSON.parse(respQuesitosHttp.getContentText());
          if (jsonQuesitos) {
            if (jsonQuesitos.respostas) {
              respostasQuesitos = jsonQuesitos.respostas;
            }
            // 🛡️ FALLBACK GARANTIDO: Salva os arquivos LaTeX (.tex) e CSV (.csv) imediatamente no Drive
            if (jsonQuesitos.dadosTex) {
              var blobDadosTex = Utilities.newBlob(jsonQuesitos.dadosTex, "text/plain; charset=utf-8", "dados.tex");
              inspectionFolder.createFile(blobDadosTex);
            }
            if (jsonQuesitos.modeloAutoTex) {
              var blobModeloTex = Utilities.newBlob(jsonQuesitos.modeloAutoTex, "text/plain; charset=utf-8", "modelo_auto.tex");
              inspectionFolder.createFile(blobModeloTex);
            }
            if (jsonQuesitos.historicoCsv) {
              var blobCsv = Utilities.newBlob(jsonQuesitos.historicoCsv, "text/csv; charset=utf-8", "historico_consumo.csv");
              inspectionFolder.createFile(blobCsv);
            }
          }
        } catch (errQ) {
          console.warn("Aviso ao responder quesitos com Gemini (usando fallback):", errQ.toString());
        }

        // --- ETAPA 2: Compilação do PDF Oficial com Tectonic XeTeX (~12 a 25s) ---
        var payloadCompilacao = Object.assign({}, dadosProcesso, dadosVistoria, {
          quesitosDoJuizo: respostasQuesitos.quesitosDoJuizo || respostasQuesitos.quesitos_juizo,
          quesitosDoAutor: respostasQuesitos.quesitosDoAutor || respostasQuesitos.quesitos_autor,
          quesitosDoReu: respostasQuesitos.quesitosDoReu || respostasQuesitos.quesitos_reu,
          returnBase64: true
        });

        var respCompilacaoHttp = UrlFetchApp.fetch(MICROSERVICE_LATEX_BASE_URL + "/api/compilar-laudo", {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(payloadCompilacao),
          muteHttpExceptions: true
        });
        var jsonResp = JSON.parse(respCompilacaoHttp.getContentText());

        if (jsonResp && jsonResp.status === "sucesso") {
          // Salva Laudo PDF no Google Drive
          if (jsonResp.pdfBase64) {
            var blobPdf = Utilities.newBlob(
              Utilities.base64Decode(jsonResp.pdfBase64),
              "application/pdf",
              jsonResp.filename || ("Laudo_Oficial_" + nomeAutor.replace(/s+/g, "_") + ".pdf")
            );
            var arquivoPdf = inspectionFolder.createFile(blobPdf);
            urlLaudoGerado = arquivoPdf.getUrl();
          }

          // Atualiza dados.tex / modelo_auto / csv caso não tenham sido gravados na Etapa 1
          if (jsonResp.dadosTex && !inspectionFolder.getFilesByName("dados.tex").hasNext()) {
            inspectionFolder.createFile(Utilities.newBlob(jsonResp.dadosTex, "text/plain; charset=utf-8", "dados.tex"));
          }
          if (jsonResp.historicoCsv && !inspectionFolder.getFilesByName("historico_consumo.csv").hasNext()) {
            inspectionFolder.createFile(Utilities.newBlob(jsonResp.historicoCsv, "text/csv; charset=utf-8", "historico_consumo.csv"));
          }
          if (jsonResp.modeloAutoTex && !inspectionFolder.getFilesByName("modelo_auto.tex").hasNext()) {
            inspectionFolder.createFile(Utilities.newBlob(jsonResp.modeloAutoTex, "text/plain; charset=utf-8", "modelo_auto.tex"));
          }

          // 5. Atualiza o Link do Laudo PDF na aba Energia
          if (urlLaudoGerado && linhaGravadaIndex > 0) {
            var headersVistoria = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
            var colLaudoEnergia = acharIndiceColuna(headersVistoria, ["linkdolaudopdf", "laudopdf", "linklaudo", "laudo"]);
            if (colLaudoEnergia >= 0) {
              sheet.getRange(linhaGravadaIndex, colLaudoEnergia + 1).setValue(urlLaudoGerado);
            }
          }

          // 6. Atualiza status e link na aba Processos Energia se existir
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
        console.warn("Aviso ao gerar laudo automático em 2 etapas:", errLaudo.toString());
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
 * MAPEAMENTO DINÂMICO INTELIGENTE DE COLUNAS NA ABA ENERGIA
 * =========================================================================
 */
function gravarLinhaVistoriaDinamica(sheet, data, nomeAutor, inspectionFolderUrl, urlLaudoGerado) {
  var headersRange = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 30)).getDisplayValues();
  var headers = headersRange[0];

  // Se a aba estiver vazia, cria os cabeçalhos oficiais
  if (!headers || headers.length === 0 || !headers[0]) {
    headers = [
      "Data de Envio", "Nome do Autor", "Número do Processo", "Réu / Concessionária",
      "Tipo de Ação", "Data da Vistoria", "Nº da Vistoria", "Período da Vistoria",
      "Representação Autor Presente?", "Representação Réu Presente?", "Obs. Presença das Partes",
      "Número do Medidor", "Medidor com Chip?", "Condições do Medidor", "Corte de Energia?",
      "Pessoas Residentes", "Quantidade de Cômodos", "Nº de Lâmpadas", "Nº de TVs",
      "Nº de Ventiladores", "Nº de Ventiladores de Teto", "Nº de Ar Condicionados",
      "Nº de Geladeiras", "Nº de Chuveiros Elétricos", "Nº de Máquinas de Lavar",
      "Nº de Freezers", "Checklist Técnico", "Observações Finais do Perito",
      "Link da Pasta (Google Drive)", "Link do Laudo PDF"
    ];
    sheet.appendRow(headers);
    var hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setFontWeight("bold");
    hRange.setBackground("#F3F3F3");
    sheet.setFrozenRows(1);
  }

  var dataEnvioFormatada = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  var checklistFormatado = Array.isArray(data.checklist) ? data.checklist.join(", ") : (data.checklist || "");

  // Mapeamento Chave-Valor Exaustivo com Normalização Sem Acentos
  var mapaValores = {
    "datadeenvio": dataEnvioFormatada,
    "dataenvio": dataEnvioFormatada,
    "data": dataEnvioFormatada,
    "nomedoautor": nomeAutor,
    "autor": nomeAutor,
    "numerodoprocesso": data.numeroProcesso || "",
    "processo": data.numeroProcesso || "",
    "reuconcessionaria": data.reuConcessionaria || data.nomeReu || "",
    "reu": data.reuConcessionaria || data.nomeReu || "",
    "tipodeacao": data.tipoAcao || "Consumo",
    "tipoacao": data.tipoAcao || "Consumo",
    "datadavistoria": data.dataVistoria || "",
    "datavistoria": data.dataVistoria || "",
    "ndavistoria": data.numeroVistoria || "1",
    "numerodavistoria": data.numeroVistoria || "1",
    "periododavistoria": data.periodoVistoria || "Manhã 09 - 12 h",
    "periodovistoria": data.periodoVistoria || "Manhã 09 - 12 h",
    "representacaoautorpresente": data.representacaoAutor || "Sim",
    "representacaoreupresente": data.representacaoReu || "Sim",
    "obspresencadaspartes": data.observacoesPresenca || "",
    "obspresenca": data.observacoesPresenca || "",
    "numerodomedidor": data.numeroMedidor || "",
    "medidor": data.numeroMedidor || "",
    "medidorcomchip": data.medidorChip || "Não",
    "chip": data.medidorChip || "Não",
    "condicoesdomedidor": data.condicoesMedidor || "Boa (Lacrado)",
    "condicoesmedidor": data.condicoesMedidor || "Boa (Lacrado)",
    "cortedeenergia": data.corteEnergia || "Não",
    "corte": data.corteEnergia || "Não",
    "pessoasresidentes": data.qtdPessoas || "1",
    "qtdpessoas": data.qtdPessoas || "1",
    "quantidadedecomodos": data.qtdComodos || "1",
    "qtdcomodos": data.qtdComodos || "1",
    "ndelampadas": data.numLampadas || "0",
    "lampadas": data.numLampadas || "0",
    "ndetvs": data.numTvs || "0",
    "tvs": data.numTvs || "0",
    "ndeventiladores": data.numVentiladores || "0",
    "ventiladores": data.numVentiladores || "0",
    "ndeventiladoresdeteto": data.numVentiladoresTeto || "0",
    "ventiladoresteto": data.numVentiladoresTeto || "0",
    "ndearcondicionados": data.numArCondicionados || "0",
    "arcondicionado": data.numArCondicionados || "0",
    "arcondicionados": data.numArCondicionados || "0",
    "ndegeladeiras": data.numGeladeiras || "0",
    "geladeiras": data.numGeladeiras || "0",
    "ndechuveiroseletricos": data.numChuveiros || "0",
    "chuveiros": data.numChuveiros || "0",
    "ndemaquinasdelavar": data.numMaquinasLavar || "0",
    "maquinasdelavar": data.numMaquinasLavar || "0",
    "maquinaslavar": data.numMaquinasLavar || "0",
    "ndefreezers": data.numFreezers || "0",
    "freezers": data.numFreezers || "0",
    "checklisttecnico": checklistFormatado,
    "checklist": checklistFormatado,
    "observacoesfinaisdoperito": data.observacoesFinais || "",
    "observacoesfinais": data.observacoesFinais || "",
    "linkdapastagoogledrive": inspectionFolderUrl || "",
    "linkdapasta": inspectionFolderUrl || "",
    "pastadrive": inspectionFolderUrl || "",
    "linkdolaudopdf": urlLaudoGerado || "",
    "laudopdf": urlLaudoGerado || ""
  };

  // Monta a linha dinamicamente baseando-se no nome de cada cabeçalho
  var novaLinha = [];
  for (var c = 0; c < headers.length; c++) {
    var hLimpo = String(headers[c] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (!hLimpo) {
      novaLinha.push("");
      continue;
    }

    var valor = "";
    if (mapaValores.hasOwnProperty(hLimpo)) {
      valor = mapaValores[hLimpo];
    } else {
      // Tenta correspondência flexível
      for (var k in mapaValores) {
        if (hLimpo.indexOf(k) !== -1 || k.indexOf(hLimpo) !== -1) {
          valor = mapaValores[k];
          break;
        }
      }
    }
    novaLinha.push(valor);
  }

  sheet.appendRow(novaLinha);
  return sheet.getLastRow();
}

/**
 * =========================================================================
 * FUNÇÕES AUXILIARES DE BUSCA DE ABAS E MAPEAMENTO DE COLUNAS
 * =========================================================================
 */
function buscarAbaFlexivel(ss, nomeDesejado) {
  if (!ss || !nomeDesejado) return null;
  var sheets = ss.getSheets();
  var alvoLimpo = String(nomeDesejado).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

  // 1. PRIORIDADE ABSOLUTA: Correspondência Exata
  for (var i = 0; i < sheets.length; i++) {
    var nomeAbaLimpo = String(sheets[i].getName() || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (nomeAbaLimpo === alvoLimpo) {
      return sheets[i];
    }
  }

  // 2. SEGUNDA PRIORIDADE: O nome da aba contém o nome desejado (apenas se não houver exata)
  for (var j = 0; j < sheets.length; j++) {
    var nAbaLimpo = String(sheets[j].getName() || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (nAbaLimpo.indexOf(alvoLimpo) !== -1) {
      return sheets[j];
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
 * Extrai dados da aba "Processos Energia" dinamicamente pelas 26 colunas oficiais
 */
function extrairDadosPreVistoriaDinamico(sheetProcessos, numeroProcessoBuscado, nomeAutorBuscado) {
  var dataRange = sheetProcessos.getDataRange().getDisplayValues();
  if (dataRange.length <= 1) return null;

  var headers = dataRange[0];

  var colTipo = acharIndiceColuna(headers, ["tipodeacaoconsumotoi", "tipodeacao", "tipoacao", "acao"]);
  var colProc = acharIndiceColuna(headers, ["numerodoprocessocnj", "numerodoprocesso", "processo", "numprocesso", "cnj"]);
  var colAutor = acharIndiceColuna(headers, ["nomedoautor", "autor", "parteautora"]);
  var colReu = acharIndiceColuna(headers, ["nomedoreu", "reu", "concessionaria", "empresa"]);
  var colVara = acharIndiceColuna(headers, ["varacomarca", "vara", "juizo", "comarca"]);
  var colCliente = acharIndiceColuna(headers, ["numerodoclienteinstalacao", "numerodocliente", "cliente", "instalacao", "uc"]);
  var colToi = acharIndiceColuna(headers, ["numerodotoi", "toi", "numtoi"]);
  var colDataToi = acharIndiceColuna(headers, ["datalavraturatoi", "datalavratura"]);
  var colIrreg = acharIndiceColuna(headers, ["irregularidadealegadagatodesvio", "irregularidadealegada", "irregularidade", "gato"]);
  var colValRec = acharIndiceColuna(headers, ["valorderecuperacaocobrador", "valorrecuperacao", "valorrecuperado", "recuperacaoconsumo"]);
  var colEnd = acharIndiceColuna(headers, ["enderecocompletodapericia", "enderecocompleto", "endereco", "local"]);
  var colObj = acharIndiceColuna(headers, ["objetivodapericia", "objetivo", "escopo"]);
  var colResumo = acharIndiceColuna(headers, ["resumodoprocesso", "resumo", "sintese"]);
  var colAleg = acharIndiceColuna(headers, ["alegacoesdoautorformatadocom", "alegacoesdoautor", "alegacoesautor", "fatosautor"]);
  var colCont = acharIndiceColuna(headers, ["contestacoesdoreuformatadocom", "contestacoesdoreu", "contestacoesreu", "fatosreu"]);
  var colRedIni = acharIndiceColuna(headers, ["inicioperiodocontrovertidomesano", "inicioreducao", "reducaoinicio"]);
  var colRedFim = acharIndiceColuna(headers, ["fimperiodocontrovertidomesano", "fimreducao", "reducaofim"]);
  var colConsMedio = acharIndiceColuna(headers, ["consumomedioregularkwh", "consumomedio", "mediaregular"]);
  var colConsRecl = acharIndiceColuna(headers, ["consumomedioreclamadokwh", "consumoreclamado", "mediareclamada"]);
  var colHistIni = acharIndiceColuna(headers, ["datainiciohistoricofaturas", "iniciofaturas", "faturasinicio"]);
  var colHistFim = acharIndiceColuna(headers, ["datafimhistoricofaturas", "fimfaturas", "faturasfim"]);
  var colCsv = acharIndiceColuna(headers, ["historicodeconsumocsvmultilinha", "historicodeconsumo", "historicocsv", "csv"]);
  var colQJuizo = acharIndiceColuna(headers, ["quesitosdojuizobrutos", "quesitosdojuizo", "quesitosjuizo"]);
  var colQAutor = acharIndiceColuna(headers, ["quesitosdoautorbrutos", "quesitosdoautor", "quesitosautor"]);
  var colQReu = acharIndiceColuna(headers, ["quesitosdoreubrutos", "quesitosdoreu", "quesitosreu"]);
  var colStatus = acharIndiceColuna(headers, ["statusdaautomacao", "status", "situacao"]);
  var colLink = acharIndiceColuna(headers, ["linkdolaudopdf", "laudopdf", "linklaudo", "laudo"]);

  var procBuscadoLimpo = numeroProcessoBuscado ? numeroProcessoBuscado.toString().replace(/[^0-9]/g, "") : "";
  var autorBuscadoLimpo = nomeAutorBuscado ? nomeAutorBuscado.toString().toLowerCase().trim() : "";

  var rowTarget = null;
  var linhaEncontradaIndex = -1;

  for (var i = 1; i < dataRange.length; i++) {
    var r = dataRange[i];
    var pVal = colProc >= 0 ? String(r[colProc] || "").replace(/[^0-9]/g, "") : "";
    var aVal = colAutor >= 0 ? String(r[colAutor] || "").toLowerCase().trim() : "";

    if (procBuscadoLimpo && pVal && pVal === procBuscadoLimpo) {
      rowTarget = r;
      linhaEncontradaIndex = i + 1;
      break;
    }

    if (autorBuscadoLimpo && aVal && (aVal === autorBuscadoLimpo || aVal.indexOf(autorBuscadoLimpo) !== -1 || autorBuscadoLimpo.indexOf(aVal) !== -1)) {
      rowTarget = r;
      linhaEncontradaIndex = i + 1;
      break;
    }
  }

  if (rowTarget) {
    return {
      linhaIndex: linhaEncontradaIndex,
      colunaStatus: colStatus >= 0 ? colStatus + 1 : -1,
      colunaLink: colLink >= 0 ? colLink + 1 : -1,
      dados: {
        tipoAcao: colTipo >= 0 ? String(rowTarget[colTipo] || "Consumo") : "Consumo",
        numeroProcesso: colProc >= 0 ? String(rowTarget[colProc] || "") : "",
        nomeAutor: colAutor >= 0 ? String(rowTarget[colAutor] || "") : "",
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

function criarOuObterPasta(parentFolder, nomePasta) {
  var pastas = parentFolder.getFoldersByName(nomePasta);
  if (pastas.hasNext()) return pastas.next();
  return parentFolder.createFolder(nomePasta);
}

function criarPastaVistoriaComVersionamento(parentFolder, baseName) {
  var pastas = parentFolder.getFoldersByName(baseName);
  if (!pastas.hasNext()) {
    return parentFolder.createFolder(baseName);
  }
  // Se a pasta já existir (reenvio/vistoria repetida), cria uma NOVA pasta numerada
  // garantindo que os arquivos da vistoria anterior NUNCA sejam apagados ou sobrescritos
  var count = 2;
  while (true) {
    var nomeVersao = baseName + " (Vistoria " + count + ")";
    var busca = parentFolder.getFoldersByName(nomeVersao);
    if (!busca.hasNext()) {
      return parentFolder.createFolder(nomeVersao);
    }
    count++;
  }
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
  var data = sheet.getRange(startRow, 1, numLinhasVerificar, Math.min(sheet.getLastColumn(), 10)).getDisplayValues();
  
  var procLimpo = numeroProcesso ? numeroProcesso.toString().replace(/[^0-9]/g, "") : "";
  var autorLimpo = nomeAutor ? nomeAutor.toString().toLowerCase().trim() : "";
  
  for (var i = data.length - 1; i >= 0; i--) {
    var rowAutor = data[i][1] ? data[i][1].toString().toLowerCase().trim() : "";
    var rowProc = data[i][2] ? data[i][2].toString().replace(/[^0-9]/g, "") : "";
    if (procLimpo && rowProc && procLimpo === rowProc) return true;
    if (autorLimpo && rowAutor && autorLimpo === rowAutor) {
      if (dataVistoria && data[i][5]) {
        var rowDataVistoria = data[i][5].toString();
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
