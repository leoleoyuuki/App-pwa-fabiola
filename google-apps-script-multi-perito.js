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
          
          var colData = acharIndiceColuna(headers, ["datadavistoria", "datavistoria", "dataagendada", "dataagendamento", "dataagenda", "agendamento", "data", "dia"]);
          if (colData < 0 && headers.length > 0) {
            var h0 = String(headers[0] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (h0.indexOf("data") !== -1 || h0.indexOf("dia") !== -1 || h0.indexOf("agenda") !== -1) {
              colData = 0;
            }
          }
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
          var colCsv = acharIndiceColuna(headers, ["historicoconsumocsv", "historicocsv", "faturascsv", "csvconsumo", "csv", "consumocsv"]);
          var colQJuizo = acharIndiceColuna(headers, ["quesitosdojuizobrutos", "quesitosdojuizo", "quesitosjuizo", "quesitosdojuiz", "quesitosjuiz", "quesitosjuizobruto", "perguntasdojuizo", "juizobrutos", "juizobruto", "quesitosjudiciais", "quesitosdojuizoformatado", "quesitosdojuizotexto", "pontoscontrovertidos", "pontoscontrovertidosjuizo", "decisaosaneadora", "saneador", "juizo", "quesitos"]);
          var colQAutor = acharIndiceColuna(headers, ["quesitosdoautorbrutos", "quesitosdoautor", "quesitosautor", "quesitosdaautora", "quesitosautora", "quesitosautorbruto", "perguntasdoautor", "autorbrutos", "autorbruto", "quesitosdoautorformatado", "quesitosdoautortexto"]);
          var colQReu = acharIndiceColuna(headers, ["quesitosdoreubrutos", "quesitosdoreu", "quesitosreu", "quesitosdare", "quesitosre", "quesitosreubruto", "perguntasdoreu", "reubrutos", "reubruto", "quesitosdoreuformatado", "quesitosdoreutexto", "quesitosdareu"]);
          var colStatus = acharIndiceColuna(headers, ["statusdaautomacao", "status", "situacao"]);
          
          for (var i = 1; i < dataProcessos.length; i++) {
            var row = dataProcessos[i];
            var numProcVal = colProc >= 0 ? String(row[colProc] || "").trim() : "";
            var autorVal = colAutor >= 0 ? String(row[colAutor] || "").trim() : "";
            
            if (!numProcVal && !autorVal) continue;
            
            processos.push({
              linhaIndex: i + 1,
              dataVistoria: colData >= 0 ? String(row[colData] || "").trim() : "",
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

    // 1.1 AÇÃO: Vistorias da Planilha Antiga cruzadas com a aba "Processos Energia"
    if (action === "vistorias_antigas" || action === "antigas" || action === "planilha_antiga") {
      var idPlanilhaAntiga = params.oldSpreadsheetId || "1bk2TXTKdCJzz7opVk8LazhHVduUJRvjzalSL0ZOskkA";
      var ssAntiga = SpreadsheetApp.openById(idPlanilhaAntiga);
      var sheetAntiga = ssAntiga.getSheets()[0];
      var dataAntiga = sheetAntiga.getDataRange().getDisplayValues();
      
      var sheetProcessosRef = buscarAbaFlexivel(ss, "Processos Energia") || buscarAbaFlexivel(ss, "Processos");
      var mapaProcessos = {};
      var mapaProcessosPorAutor = {};
      if (sheetProcessosRef) {
        var dataProc = sheetProcessosRef.getDataRange().getDisplayValues();
        if (dataProc.length > 1) {
          var hProc = dataProc[0];
          var colProcIdx = acharIndiceColuna(hProc, ["numerodoprocessocnj", "numerodoprocesso", "processo", "cnj"], ["tipo"]);
          var colAutorIdx = acharIndiceColuna(hProc, ["nomedoautor", "autor", "parteautora", "requerente"], ["representacao", "advogado", "patrono"]);
          for (var pIdx = 1; pIdx < dataProc.length; pIdx++) {
            var rP = dataProc[pIdx];
            var numP = colProcIdx >= 0 ? String(rP[colProcIdx] || "") : "";
            var digitsP = numP.replace(/[^0-9]/g, "");
            var autorP = colAutorIdx >= 0 ? String(rP[colAutorIdx] || "").trim() : "";
            var autorKey = autorP.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
            
            var procObj = { linhaIndex: pIdx + 1, rowData: rP, headers: hProc, numeroProcesso: numP, nomeAutor: autorP };
            if (digitsP) {
              mapaProcessos[digitsP] = procObj;
            }
            if (autorKey && autorKey.length >= 3) {
              mapaProcessosPorAutor[autorKey] = procObj;
            }
          }
        }
      }

      var vistoriasAntigas = [];
      if (dataAntiga.length > 1) {
        var hAntiga = dataAntiga[0];
        
        var cDataHora = acharIndiceColuna(hAntiga, ["carimbodedatahora", "carimbo", "datahora"]);
        if (cDataHora < 0) cDataHora = 0;

        var cAutor = acharIndiceColuna(hAntiga, ["nomedoautor", "autor", "parteautora"], ["representacao", "presenca"]);
        if (cAutor < 0) cAutor = 3;

        var cProc = acharIndiceColuna(hAntiga, ["numerodoprocessocnj", "numerodoprocesso", "numeroprocesso", "numprocesso", "processo", "cnj"], ["representacao", "presenca", "secao", "vincular"]);
        if (cProc < 0) cProc = 4;

        var cReu = acharIndiceColuna(hAntiga, ["reuconcessionaria", "concessionaria", "nomedoreu"], ["representacao", "presenca"]);
        if (cReu < 0) cReu = 5;

        var cDataVist = acharIndiceColuna(hAntiga, ["datadavistoria", "datavistoria"]);
        if (cDataVist < 0) cDataVist = 7;

        var cPeriodo = acharIndiceColuna(hAntiga, ["periododavistoria", "periodovistoria"]);
        if (cPeriodo < 0) cPeriodo = 8;

        var cRepAut = acharIndiceColuna(hAntiga, ["representacaodoautorpresente", "representacaoautorpresente", "representacaoautor"]);
        if (cRepAut < 0) cRepAut = 10;

        var cRepReu = acharIndiceColuna(hAntiga, ["representacaodoreupresente", "representacaoreupresente", "representacaoreu"]);
        if (cRepReu < 0) cRepReu = 11;

        var cObsPres = acharIndiceColuna(hAntiga, ["observacoessobrepresencadaspartes", "obspresenca", "observacoespresenca"]);
        if (cObsPres < 0) cObsPres = 12;

        var cNumMed = acharIndiceColuna(hAntiga, ["numerodomedidor", "medidor"]);
        if (cNumMed < 0) cNumMed = 14;

        var cTipoAcao = acharIndiceColuna(hAntiga, ["tipodeacao", "tipoacao"]);
        if (cTipoAcao < 0) cTipoAcao = 15;

        var cChip = acharIndiceColuna(hAntiga, ["medidorpossuichipsmartcard", "medidorcomchip", "chip"]);
        if (cChip < 0) cChip = 16;

        var cCond = acharIndiceColuna(hAntiga, ["condicoesvisuaisdomedidor", "condicoesdomedidor"]);
        if (cCond < 0) cCond = 17;

        var cPessoas = acharIndiceColuna(hAntiga, ["quantidadedepessoasresidentes", "pessoasresidentes", "qtdpessoas"]);
        if (cPessoas < 0) cPessoas = 19;

        var cComodos = acharIndiceColuna(hAntiga, ["quantidadedecomodos", "comodos"]);
        if (cComodos < 0) cComodos = 20;

        var cLamp = acharIndiceColuna(hAntiga, ["ndelampadas", "lampadas"]);
        if (cLamp < 0) cLamp = 22;

        var cTvs = acharIndiceColuna(hAntiga, ["ndetvs", "tvs"]);
        if (cTvs < 0) cTvs = 23;

        var cVent = acharIndiceColuna(hAntiga, ["ndeventiladores", "ventiladores"]);
        if (cVent < 0) cVent = 24;

        var cGel = acharIndiceColuna(hAntiga, ["ndegeladeiras", "geladeiras"]);
        if (cGel < 0) cGel = 25;

        var cCorte = acharIndiceColuna(hAntiga, ["houvecortedeenergia", "cortedeenergia", "corte"]);
        if (cCorte < 0) cCorte = 26;

        var cVentTeto = acharIndiceColuna(hAntiga, ["ndeventiladoresdeteto", "ventiladoresteto"]);
        if (cVentTeto < 0) cVentTeto = 27;

        var cAr = acharIndiceColuna(hAntiga, ["ndearcondicionados", "arcondicionados"]);
        if (cAr < 0) cAr = 28;

        var cFreezer = acharIndiceColuna(hAntiga, ["ndefreezers", "freezers"]);
        if (cFreezer < 0) cFreezer = 29;

        var cChuv = acharIndiceColuna(hAntiga, ["ndechuveiroseletricos", "chuveiros"]);
        if (cChuv < 0) cChuv = 30;

        var cMaq = acharIndiceColuna(hAntiga, ["ndemaquinasdelavarroupa", "maquinasdelavar"]);
        if (cMaq < 0) cMaq = 31;

        var cFotoImovel = acharIndiceColuna(hAntiga, ["fotosdoimovel", "fotosimovel"]);
        if (cFotoImovel < 0) cFotoImovel = 32;

        var cFotoMed = acharIndiceColuna(hAntiga, ["fotosdomedidor", "fotosmedidor"]);
        if (cFotoMed < 0) cFotoMed = 33;

        var cChecklist = acharIndiceColuna(hAntiga, ["checklisttecnico", "checklist"]);
        if (cChecklist < 0) cChecklist = 34;

        var cObsFinais = acharIndiceColuna(hAntiga, ["observacoesfinais", "observacoes"]);
        if (cObsFinais < 0) cObsFinais = 35;

        var cNumVist = acharIndiceColuna(hAntiga, ["ndavistoria", "numerodavistoria"]);
        if (cNumVist < 0) cNumVist = 38;

        for (var i = 1; i < dataAntiga.length; i++) {
          var r = dataAntiga[i];
          var numProcVal = cProc >= 0 ? String(r[cProc] || "").trim() : "";
          var autorVal = cAutor >= 0 ? String(r[cAutor] || "").trim() : "";
          var reuVal = cReu >= 0 ? String(r[cReu] || "").trim() : "";

          // Auto-correção defensiva caso tenha havido deslocamento
          var lowerAutor = autorVal.toLowerCase();
          if (lowerAutor === "sim" || lowerAutor === "nao" || lowerAutor === "não" || lowerAutor.indexOf("justificativa") !== -1 || lowerAutor.indexOf("presente") !== -1 || lowerAutor.indexOf("ausente") !== -1) {
            if (r[3] && String(r[3]).length > 2) {
              autorVal = String(r[3]).trim();
            }
          }

          // Se numProcVal estiver vazio ou com menos de 7 dígitos, tenta da coluna E original (r[4])
          if (!numProcVal.replace(/[^0-9]/g, "") || numProcVal.replace(/[^0-9]/g, "").length < 7) {
            if (r[4] && String(r[4]).replace(/[^0-9]/g, "").length >= 7) {
              numProcVal = String(r[4]).trim();
            }
          }

          var lowerReu = reuVal.toLowerCase();
          if (!reuVal || lowerReu === "sim" || lowerReu === "nao" || lowerReu === "não" || lowerReu.indexOf("justificativa") !== -1 || lowerReu.indexOf("presente") !== -1 || lowerReu.indexOf("ausente") !== -1) {
            if (r[5] && String(r[5]).trim()) {
              reuVal = String(r[5]).trim();
            } else {
              reuVal = "ENEL / AMPLA ENERGIA E SERVIÇOS S.A.";
            }
          }

          if (!numProcVal && !autorVal) continue;

          var digits = numProcVal.replace(/[^0-9]/g, "");
          var autorKey = autorVal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
          var preEnc = digits ? mapaProcessos[digits] : null;

          if (!preEnc && autorKey) {
            if (mapaProcessosPorAutor[autorKey]) {
              preEnc = mapaProcessosPorAutor[autorKey];
            } else {
              for (var ak in mapaProcessosPorAutor) {
                if (ak.indexOf(autorKey) !== -1 || autorKey.indexOf(ak) !== -1) {
                  preEnc = mapaProcessosPorAutor[ak];
                  break;
                }
              }
            }
          }

          var dadosPre = null;
          if (preEnc) {
            dadosPre = extrairDadosPreVistoriaDinamico(sheetProcessosRef, numProcVal || preEnc.numeroProcesso, autorVal || preEnc.nomeAutor, cDataVist >= 0 ? r[cDataVist] : "");
            if ((!autorVal || autorVal.length < 3) && preEnc.nomeAutor) {
              autorVal = preEnc.nomeAutor;
            }
            if ((!numProcVal || numProcVal.replace(/[^0-9]/g, "").length < 7) && preEnc.numeroProcesso) {
              numProcVal = preEnc.numeroProcesso;
            }
          }

          vistoriasAntigas.push({
            origem: "planilha_antiga",
            linhaIndex: i + 1,
            dataEnvio: cDataHora >= 0 ? String(r[cDataHora] || "") : "",
            nomeAutor: autorVal,
            numeroProcesso: numProcVal,
            reuConcessionaria: reuVal || "AMPLA ENERGIA E SERVIÇOS S.A.",
            tipoAcao: cTipoAcao >= 0 ? String(r[cTipoAcao] || "Consumo") : "Consumo",
            dataVistoria: cDataVist >= 0 ? String(r[cDataVist] || "") : "",
            numeroVistoria: cNumVist >= 0 ? String(r[cNumVist] || "1") : "1",
            periodoVistoria: cPeriodo >= 0 ? String(r[cPeriodo] || "Manhã 09 - 12 h") : "Manhã 09 - 12 h",
            representacaoAutor: cRepAut >= 0 ? String(r[cRepAut] || "Sim") : "Sim",
            representacaoReu: cRepReu >= 0 ? String(r[cRepReu] || "Não") : "Não",
            observacoesPresenca: cObsPres >= 0 ? String(r[cObsPres] || "") : "",
            numeroMedidor: cNumMed >= 0 ? String(r[cNumMed] || "") : "",
            medidorChip: cChip >= 0 ? String(r[cChip] || "Não") : "Não",
            condicoesMedidor: cCond >= 0 ? String(r[cCond] || "Boa (Lacrado)") : "Boa (Lacrado)",
            corteEnergia: cCorte >= 0 ? String(r[cCorte] || "Não") : "Não",
            qtdPessoas: cPessoas >= 0 ? String(r[cPessoas] || "3") : "3",
            qtdComodos: cComodos >= 0 ? String(r[cComodos] || "5") : "5",
            numLampadas: cLamp >= 0 ? String(r[cLamp] || "8") : "8",
            numTvs: cTvs >= 0 ? String(r[cTvs] || "2") : "2",
            numVentiladores: cVent >= 0 ? String(r[cVent] || "2") : "2",
            numVentiladoresTeto: cVentTeto >= 0 ? String(r[cVentTeto] || "1") : "1",
            numArCondicionados: cAr >= 0 ? String(r[cAr] || "0") : "0",
            numGeladeiras: cGel >= 0 ? String(r[cGel] || "1") : "1",
            numChuveiros: cChuv >= 0 ? String(r[cChuv] || "1") : "1",
            numMaquinasLavar: cMaq >= 0 ? String(r[cMaq] || "1") : "1",
            numFreezers: cFreezer >= 0 ? String(r[cFreezer] || "0") : "0",
            checklist: cChecklist >= 0 ? String(r[cChecklist] || "") : "",
            observacoesFinais: cObsFinais >= 0 ? String(r[cObsFinais] || "") : "",
            fotosImovelLinks: cFotoImovel >= 0 ? String(r[cFotoImovel] || "") : "",
            fotosMedidorLinks: cFotoMed >= 0 ? String(r[cFotoMed] || "") : "",
            temPreVistoria: !!dadosPre,
            preVistoria: dadosPre ? dadosPre.dados : null
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "sucesso",
        total: vistoriasAntigas.length,
        comPreVistoria: vistoriasAntigas.filter(function(v) { return v.temPreVistoria; }).length,
        vistorias: vistoriasAntigas
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1.1 AÇÃO: Migrar UMA Vistoria Específica da Planilha Antiga para a Planilha Principal (Item 2)
    if (action === "migrar_vistoria_antiga" || action === "gravar_vistoria_antiga") {
      try {
        var linhaAlvo = parseInt(params.linhaIndex || params.linha || "0", 10);
        var procAlvo = String(params.processo || params.numeroProcesso || "").trim();
        var autorAlvo = String(params.nomeAutor || params.autor || "").trim();

        var sheetEnergia = buscarAbaFlexivel(ss, "Energia") || buscarAbaFlexivel(ss, "Respostas ao formulário 1") || ss.getSheets()[0];
        var idPlanilhaAntiga = "1bk2TXTKdCJzz7opVk8LazhHVduUJRvjzalSL0ZOskkA";
        var ssAntiga = SpreadsheetApp.openById(idPlanilhaAntiga);
        var abaAntiga = ssAntiga.getSheets()[0];
        var linhasAntigas = abaAntiga.getDataRange().getDisplayValues();

        var linhaEncontrada = null;
        if (linhaAlvo > 1 && linhaAlvo <= linhasAntigas.length) {
          linhaEncontrada = linhasAntigas[linhaAlvo - 1];
        } else if (procAlvo || autorAlvo) {
          var procAlvoDig = procAlvo.replace(/[^0-9]/g, "");
          var autorAlvoLimpo = autorAlvo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
          for (var li = 1; li < linhasAntigas.length; li++) {
            var rLinha = linhasAntigas[li];
            var procLinha = String(rLinha[4] || "");
            var procLinhaDig = procLinha.replace(/[^0-9]/g, "");
            var autorLinha = String(rLinha[3] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
            if ((procAlvoDig && procLinhaDig && procLinhaDig === procAlvoDig) || (autorAlvoLimpo && autorLinha && (autorLinha.indexOf(autorAlvoLimpo) !== -1 || autorAlvoLimpo.indexOf(autorLinha) !== -1))) {
              linhaEncontrada = rLinha;
              break;
            }
          }
        }

        if (!linhaEncontrada) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "erro",
            message: "Vistoria específica não localizada na planilha antiga."
          })).setMimeType(ContentService.MimeType.JSON);
        }

        var nomeAutorExt = linhaEncontrada[3] || "";
        var numProcExt = linhaEncontrada[4] || "";
        var reuExt = linhaEncontrada[5] || "";

        var lowerAut = String(nomeAutorExt).toLowerCase();
        if (!nomeAutorExt || lowerAut === "sim" || lowerAut === "nao" || lowerAut === "não" || lowerAut.indexOf("justificativa") !== -1 || lowerAut.indexOf("presente") !== -1 || lowerAut.indexOf("ausente") !== -1) {
          if (autorAlvo && autorAlvo.length > 2) {
            nomeAutorExt = autorAlvo;
          }
        }
        if (!String(numProcExt).replace(/[^0-9]/g, "") && procAlvo) {
          numProcExt = procAlvo;
        }
        var lowerReu = String(reuExt).toLowerCase();
        if (!reuExt || lowerReu === "sim" || lowerReu === "nao" || lowerReu === "não" || lowerReu.indexOf("justificativa") !== -1 || lowerReu.indexOf("presente") !== -1 || lowerReu.indexOf("ausente") !== -1) {
          reuExt = "ENEL / AMPLA ENERGIA E SERVIÇOS S.A.";
        }

        var objVistoria = {
          dataEnvio: linhaEncontrada[0] || "",
          nomeAutor: nomeAutorExt,
          numeroProcesso: numProcExt,
          reuConcessionaria: reuExt,
          tipoAcao: linhaEncontrada[15] || "Consumo",
          dataVistoria: linhaEncontrada[7] || "",
          numeroVistoria: linhaEncontrada[38] || "1",
          periodoVistoria: linhaEncontrada[8] || "Tarde",
          representacaoAutor: linhaEncontrada[10] || "Presente",
          representacaoReu: linhaEncontrada[11] || "Ausente",
          observacoesPresenca: linhaEncontrada[12] || "",
          numeroMedidor: linhaEncontrada[14] || "",
          medidorChip: linhaEncontrada[16] || "Não",
          condicoesMedidor: linhaEncontrada[17] || "Boa (Lacrado)",
          corteEnergia: linhaEncontrada[26] || "Não",
          qtdPessoas: linhaEncontrada[19] || "3",
          qtdComodos: linhaEncontrada[20] || "5",
          numLampadas: linhaEncontrada[22] || "8",
          numTvs: linhaEncontrada[23] || "2",
          numVentiladores: linhaEncontrada[24] || "2",
          numVentiladoresTeto: linhaEncontrada[27] || "1",
          numArCondicionados: linhaEncontrada[28] || "0",
          numGeladeiras: linhaEncontrada[25] || "1",
          numChuveiros: linhaEncontrada[30] || "1",
          numMaquinasLavar: linhaEncontrada[31] || "1",
          numFreezers: linhaEncontrada[29] || "0",
          checklist: linhaEncontrada[34] || "",
          observacoesFinais: linhaEncontrada[35] || "",
          linkDrive: ""
        };

        var autorCap = capitalizarNome(objVistoria.nomeAutor || "Autor Sem Nome");
        var numProcLimpo = objVistoria.numeroProcesso || "";

        var resultado = processarMigracaoVistoriaLegadaCompleta(ss, config, objVistoria, autorCap, numProcLimpo, params.mainFolderId);
        return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON);
      } catch (errMigSingle) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "erro",
          message: "Erro ao migrar vistoria única: " + errMigSingle.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. AÇÃO: Obter Arquivos de Dados do Laudo do Drive (dados.tex, historico.csv, modelo_auto.tex)
    if (action === "getdrivefiles" || action === "drivefiles" || action === "files") {
      var targetFolderUrl = params.folderUrl || params.folder || params.url || "";
      var folderId = extrairFolderId(targetFolderUrl);
      var filesResult = { 
        status: "sucesso",
        dadosTex: "", 
        historicoCsv: "", 
        modeloAutoTex: "",
        folderId: folderId || "",
        foundFiles: []
      };

      if (folderId) {
        try {
          var targetFolder = DriveApp.getFolderById(folderId);
          if (targetFolder) {
            var filesIterator = targetFolder.getFiles();
            while (filesIterator.hasNext()) {
              var fObj = filesIterator.next();
              var fName = fObj.getName().toLowerCase();
              
              if (!filesResult.dadosTex && fName.indexOf("dado") !== -1 && fName.indexOf(".tex") !== -1) {
                filesResult.dadosTex = fObj.getBlob().getDataAsString("UTF-8");
                filesResult.foundFiles.push(fObj.getName());
              } else if (!filesResult.historicoCsv && (fName.indexOf("historico") !== -1 || fName.indexOf("consumo") !== -1 || fName.indexOf("fatura") !== -1) && fName.indexOf(".csv") !== -1) {
                filesResult.historicoCsv = fObj.getBlob().getDataAsString("UTF-8");
                filesResult.foundFiles.push(fObj.getName());
              } else if (!filesResult.modeloAutoTex && fName.indexOf("modelo") !== -1 && fName.indexOf(".tex") !== -1) {
                filesResult.modeloAutoTex = fObj.getBlob().getDataAsString("UTF-8");
                filesResult.foundFiles.push(fObj.getName());
              }
            }
          }
        } catch (eF) {
          console.warn("Aviso ao buscar arquivos do drive:", eF.toString());
          filesResult.error = eF.toString();
        }
      }
      return ContentService.createTextOutput(JSON.stringify(filesResult)).setMimeType(ContentService.MimeType.JSON);
    }

    // 2.1 AÇÃO: Obter Fotos de uma Pasta do Drive para "Retomar Vistoria" e Compilação do Laudo
    if (action === "getdrivephotos" || action === "fotosdrive" || action === "photos") {
      var targetFolderUrl = params.folderUrl || params.folder || params.url || "";
      var folderId = extrairFolderId(targetFolderUrl);
      var result = { photosImovel: [], photosMedidor: [] };

      if (folderId) {
        try {
          var targetFolder = DriveApp.getFolderById(folderId);
          if (targetFolder) {
            result = extrairFotosDePastaDrive(targetFolder);
          }
        } catch (eDrive) {
          console.warn("Aviso ao buscar fotos do drive:", eDrive.toString());
          result.error = eDrive.toString();
        }
      }
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    // 2.2 AÇÃO: Listar Laudos Públicos do Portfólio Geral no Google Drive
    // Pasta Alvo Oficial: 1zMcAmdNz0JysHqtKI_qqJ6-2U5uJWzVx
    if (action === "listar_portfolio" || action === "portfolio") {
      var targetFolderId = params.folderId || "1zMcAmdNz0JysHqtKI_qqJ6-2U5uJWzVx";
      var arquivosPortfolio = [];
      try {
        var rootPort = DriveApp.getFolderById(targetFolderId);
        if (rootPort) {
          var catFolders = rootPort.getFolders();
          while (catFolders.hasNext()) {
            var catF = catFolders.next();
            var catName = catF.getName();
            
            // Subpastas por tipo (TOI, Consumo, etc)
            var subFolders = catF.getFolders();
            while (subFolders.hasNext()) {
              var subF = subFolders.next();
              var subName = subF.getName();
              
              var files = subF.getFiles();
              while (files.hasNext()) {
                var fl = files.next();
                if (fl.getMimeType() === "application/pdf" || fl.getName().toLowerCase().endsWith(".pdf")) {
                  arquivosPortfolio.push({
                    id: fl.getId(),
                    name: fl.getName(),
                    size: fl.getSize(),
                    dateCreated: fl.getDateCreated().toISOString(),
                    categoria: catName,
                    subtipo: subName,
                    viewUrl: "https://drive.google.com/file/d/" + fl.getId() + "/view",
                    downloadUrl: "https://drive.google.com/uc?export=download&id=" + fl.getId(),
                    folderUrl: subF.getUrl()
                  });
                }
              }
            }

            // Arquivos soltos diretamente na categoria
            var directFiles = catF.getFiles();
            while (directFiles.hasNext()) {
              var dFl = directFiles.next();
              if (dFl.getMimeType() === "application/pdf" || dFl.getName().toLowerCase().endsWith(".pdf")) {
                arquivosPortfolio.push({
                  id: dFl.getId(),
                  name: dFl.getName(),
                  size: dFl.getSize(),
                  dateCreated: dFl.getDateCreated().toISOString(),
                  categoria: catName,
                  subtipo: "Geral",
                  viewUrl: "https://drive.google.com/file/d/" + dFl.getId() + "/view",
                  downloadUrl: "https://drive.google.com/uc?export=download&id=" + dFl.getId(),
                  folderUrl: catF.getUrl()
                });
              }
            }
          }
        }
      } catch (ePort) {
        console.warn("Erro ao listar portfolio:", ePort.toString());
      }
      return ContentService.createTextOutput(JSON.stringify({
        portfolioFolderId: targetFolderId,
        portfolioUrl: "https://drive.google.com/drive/folders/" + targetFolderId,
        total: arquivosPortfolio.length,
        arquivos: arquivosPortfolio
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. PADRÃO / AÇÃO: Relatórios de Vistorias across all categories (Energia, Água, Gás, Imobiliário)
    var abasVistorias = ["Energia", "Água", "Gás", "Imobiliário"];
    var relatorios = [];
    
    for (var a = 0; a < abasVistorias.length; a++) {
      var abaNome = abasVistorias[a];
      var sheetAtual = buscarAbaFlexivel(ss, abaNome);
      if (!sheetAtual) continue;
      
      var dataAba = sheetAtual.getDataRange().getDisplayValues();
      if (dataAba.length > 1) {
        var headersAba = dataAba[0];
        for (var r = 1; r < dataAba.length; r++) {
          var linha = dataAba[r];
          var item = { categoriaVistoria: abaNome };
          var temDado = false;
          for (var c = 0; c < headersAba.length; c++) {
            var headerOriginal = String(headersAba[c] || "").trim();
            if (!headerOriginal) continue;
            var val = linha[c] || "";
            if (val) temDado = true;

            item[headerOriginal] = val;
            var chaveSemEspacos = headerOriginal.replace(/\s+/g, "");
            item[chaveSemEspacos] = val;
            var chaveLimpa = chaveSemEspacos.replace(/[\/\.\?]/g, "");
            item[chaveLimpa] = val;
            var chaveNorm = headerOriginal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
            if (chaveNorm) {
              item[chaveNorm] = val;
            }
          }
          if (temDado) {
            item.linhaIndex = r + 1;
            item.dataEnvio = item["Data de Envio"] || item["DatadeEnvio"] || item["datadeenvio"] || item["Carimbo de data/hora"] || "";
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

    // 🚀 AÇÃO DEDICADA: Upload de Laudo Público (LGPD) para o Portfólio Geral no Google Drive
    // Pasta Alvo Oficial: 1zMcAmdNz0JysHqtKI_qqJ6-2U5uJWzVx
    if (data.action === "upload_portfolio_laudo" || data.action === "salvar_laudo_publico" || data.action === "portfolio_upload") {
      try {
        var targetFolderId = data.portfolioFolderId || data.targetFolderId || "1zMcAmdNz0JysHqtKI_qqJ6-2U5uJWzVx";
        var rootFolder = DriveApp.getFolderById(targetFolderId);
        
        var categoria = String(data.categoria || "Energia").trim();
        var subtipo = String(data.subtipo || "Consumo").trim();
        
        var nomeCatPasta = "Energia";
        var catLower = categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (catLower.indexOf("agua") !== -1) nomeCatPasta = "Água";
        else if (catLower.indexOf("gas") !== -1) nomeCatPasta = "Gás";
        else if (catLower.indexOf("imov") !== -1 || catLower.indexOf("patrim") !== -1 || catLower.indexOf("civil") !== -1) nomeCatPasta = "Imóvel";
        
        var pastaCat = criarOuObterPasta(rootFolder, nomeCatPasta);
        var pastaSub = criarOuObterPasta(pastaCat, subtipo);
        
        var filename = data.filename || ("Laudo_Publico_LGPD_" + (data.processo || "laudo").toString().replace(/\D/g, "") + ".pdf");
        if (!filename.toLowerCase().endsWith(".pdf")) filename += ".pdf";
        
        var pdfBase64 = data.pdfBase64 || data.base64 || "";
        if (typeof pdfBase64 === "string") {
          pdfBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
        }
        
        if (!pdfBase64) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "erro",
            message: "Nenhum arquivo PDF base64 fornecido para salvar no portfólio."
          })).setMimeType(ContentService.MimeType.JSON);
        }
        
        var decodedBlob = Utilities.newBlob(Utilities.base64Decode(pdfBase64), "application/pdf", filename);
        var file = pastaSub.createFile(decodedBlob);
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (_) {}
        
        return ContentService.createTextOutput(JSON.stringify({
          status: "sucesso",
          fileId: file.getId(),
          fileUrl: file.getUrl(),
          downloadUrl: "https://drive.google.com/uc?export=download&id=" + file.getId(),
          viewUrl: "https://drive.google.com/file/d/" + file.getId() + "/view",
          filename: filename,
          categoria: nomeCatPasta,
          subtipo: subtipo,
          folderName: pastaSub.getName(),
          folderUrl: pastaSub.getUrl(),
          portfolioUrl: "https://drive.google.com/drive/folders/" + targetFolderId
        })).setMimeType(ContentService.MimeType.JSON);
      } catch (ePortUpload) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "erro",
          message: "Erro ao salvar no portfólio: " + ePortUpload.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    var peritoEmail = (data.peritoEmail || PERITO_PADRAO_EMAIL).toLowerCase().trim();
    var config = PERITOS_CONFIG[peritoEmail] || PERITOS_CONFIG[PERITO_PADRAO_EMAIL];
    var spreadsheetId = config.spreadsheetId;
    var mainFolderId = data.mainFolderId || config.mainFolderId;
    var ss = SpreadsheetApp.openById(spreadsheetId);

    // 🚀 AÇÃO DEDICADA: Upload Direto de Foto de Fachada para a Pasta do Drive (Item 7)
    if (data.action === "upload_fachada" || data.action === "salvar_fachada") {
      try {
        var targetFolder = localizarPastaVistoriaDrive(ss, config, data.folderUrl, data.processo || data.numeroProcesso, data.nomeAutor || data.autor, mainFolderId);
        if (targetFolder && data.base64) {
          var pastaDestino = criarOuObterPasta(targetFolder, "Fotos da Residência");

          // Remove fotos de fachada anteriores com o mesmo nome para manter atualizado
          var arqs = pastaDestino.getFilesByName("fachada.jpg");
          while (arqs.hasNext()) {
            arqs.next().setTrashed(true);
          }

          var cleanB64 = data.base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
          var decoded = Utilities.base64Decode(cleanB64);
          var blob = Utilities.newBlob(decoded, "image/jpeg", "fachada.jpg");
          var newFile = pastaDestino.createFile(blob);

          try {
            newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (_) {}

          return ContentService.createTextOutput(JSON.stringify({
            status: "sucesso",
            fileId: newFile.getId(),
            url: newFile.getUrl(),
            viewUrl: "https://drive.google.com/uc?export=view&id=" + newFile.getId(),
            folderUrl: targetFolder.getUrl(),
            nome: "fachada.jpg",
            isFachada: true,
            message: "Foto da Fachada salva com sucesso no Google Drive!"
          })).setMimeType(ContentService.MimeType.JSON);
        }
        return ContentService.createTextOutput(JSON.stringify({
          status: "erro",
          message: "Pasta do Google Drive não localizada para salvar a foto da Fachada."
        })).setMimeType(ContentService.MimeType.JSON);
      } catch (errFachada) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "erro",
          message: "Erro ao salvar foto da fachada no Drive: " + errFachada.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 🚀 AÇÃO DEDICADA: Upload Direto de Fotos da Vistoria para a Pasta do Drive Criada na Planilha
    if (data.action === "upload_fotos" || data.action === "upload_foto" || data.action === "salvar_fotos_dossie") {
      try {
        var targetFolder = localizarPastaVistoriaDrive(ss, config, data.folderUrl, data.processo || data.numeroProcesso, data.nomeAutor || data.autor, mainFolderId);

        if (!targetFolder) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "erro",
            message: "Pasta do Google Drive da vistoria não foi localizada. Verifique se a vistoria já foi gravada na planilha oficial."
          })).setMimeType(ContentService.MimeType.JSON);
        }

        var subfolderResidencia = criarOuObterPasta(targetFolder, "Fotos da Residência");
        var subfolderMedidor = criarOuObterPasta(targetFolder, "Fotos do Medidor");

        var listaFotos = [];
        if (data.fotos && Array.isArray(data.fotos)) {
          listaFotos = data.fotos;
        } else if (data.base64 || data.foto) {
          listaFotos = [data.foto || {
            nome: data.nome || ("foto_" + Date.now() + ".jpg"),
            base64: data.base64,
            categoria: data.categoria || "residencia",
            id: data.id || null
          }];
        }

        var arquivosSalvos = [];
        for (var fIdx = 0; fIdx < listaFotos.length; fIdx++) {
          var itemFoto = listaFotos[fIdx];
          var rawB64 = itemFoto.base64 || itemFoto.url || "";
          if (!rawB64) continue;

          var cleanB64 = rawB64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
          var nomeArq = itemFoto.nome || ("foto_" + (fIdx + 1) + ".jpg");

          var catItem = String(itemFoto.categoria || data.categoria || "").toLowerCase();
          var isMed = (catItem === "medidor" || catItem.indexOf("medid") !== -1 || nomeArq.toLowerCase().indexOf("medidor") !== -1);
          var pastaDest = isMed ? subfolderMedidor : subfolderResidencia;

          var mimeType = "image/jpeg";
          if (rawB64.indexOf("data:image/png") !== -1 || nomeArq.match(/\.png$/i)) {
            mimeType = "image/png";
          } else if (rawB64.indexOf("data:image/webp") !== -1 || nomeArq.match(/\.webp$/i)) {
            mimeType = "image/webp";
          }

          var decodedBytes = Utilities.base64Decode(cleanB64);
          var blobFoto = Utilities.newBlob(decodedBytes, mimeType, nomeArq);
          var novoArquivo = pastaDest.createFile(blobFoto);

          try {
            novoArquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (_) {}

          var fileId = novoArquivo.getId();
          arquivosSalvos.push({
            clientTempId: itemFoto.id || null,
            id: fileId,
            driveId: fileId,
            name: novoArquivo.getName(),
            url: novoArquivo.getUrl(),
            viewUrl: "https://drive.google.com/uc?export=view&id=" + fileId,
            thumbnailUrl: "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000",
            categoria: isMed ? "medidor" : "residencia",
            folderName: isMed ? "Fotos do Medidor" : "Fotos da Residência"
          });
        }

        return ContentService.createTextOutput(JSON.stringify({
          status: "sucesso",
          totalSalvos: arquivosSalvos.length,
          arquivos: arquivosSalvos,
          folderUrl: targetFolder.getUrl(),
          folderName: targetFolder.getName(),
          message: arquivosSalvos.length + " foto(s) enviada(s) para a pasta do Google Drive com sucesso!"
        })).setMimeType(ContentService.MimeType.JSON);
      } catch (errUploadFotos) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "erro",
          message: "Erro ao salvar foto(s) na pasta do Drive: " + errUploadFotos.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 🚀 AÇÃO DEDICADA: Migração da Vistoria da Planilha Antiga para a Planilha Principal (Item 2)
    if (data.action === "migrar_vistoria_antiga" || data.action === "gravar_vistoria_antiga") {
      try {
        var vistoriaObj = data.vistoria || data;
        var sheetEnergia = buscarAbaFlexivel(ss, "Energia") || buscarAbaFlexivel(ss, "Respostas ao formulário 1") || ss.getSheets()[0];
        
        var autorBruto = String(vistoriaObj.nomeAutor || "").trim();
        var lowerAut = autorBruto.toLowerCase();
        if (!autorBruto || lowerAut === "sim" || lowerAut === "nao" || lowerAut === "não" || lowerAut.indexOf("justificativa") !== -1 || lowerAut.indexOf("presente") !== -1 || lowerAut.indexOf("ausente") !== -1) {
          if (vistoriaObj.preVistoria && vistoriaObj.preVistoria.nomeAutor) {
            autorBruto = vistoriaObj.preVistoria.nomeAutor;
          }
        }

        var numProc = String(vistoriaObj.numeroProcesso || "").trim();
        if (!numProc.replace(/[^0-9]/g, "") && vistoriaObj.preVistoria && vistoriaObj.preVistoria.numeroProcesso) {
          numProc = vistoriaObj.preVistoria.numeroProcesso;
        }

        var reuBruto = String(vistoriaObj.reuConcessionaria || "").trim();
        var lowerReu = reuBruto.toLowerCase();
        if (!reuBruto || lowerReu === "sim" || lowerReu === "nao" || lowerReu === "não" || lowerReu === "concessionária ré" || lowerReu === "concessionaria re") {
          if (vistoriaObj.preVistoria && vistoriaObj.preVistoria.nomeReu) {
            reuBruto = vistoriaObj.preVistoria.nomeReu;
          } else {
            reuBruto = "ENEL / AMPLA ENERGIA E SERVIÇOS S.A.";
          }
        }

        vistoriaObj.nomeAutor = autorBruto || "Autor Não Identificado";
        vistoriaObj.numeroProcesso = numProc;
        vistoriaObj.reuConcessionaria = reuBruto;

        var autorCapitalizado = capitalizarNome(vistoriaObj.nomeAutor);
        var resultadoPost = processarMigracaoVistoriaLegadaCompleta(ss, config, vistoriaObj, autorCapitalizado, numProc, mainFolderId);
        return ContentService.createTextOutput(JSON.stringify(resultadoPost)).setMimeType(ContentService.MimeType.JSON);
      } catch (errMig) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "erro",
          message: "Erro ao migrar vistoria antiga: " + errMig.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    var tipo = (data.tipoAcao || data.tipoInspecao || "energia").toLowerCase().trim();

    var nomeAutorOriginal = data.nomeAutor || "Autor Sem Nome";
    var nomeAutor = capitalizarNome(nomeAutorOriginal);
    
    // 🛡️ CAMADA 1: PREVENÇÃO CONTRA DUPLO CLIQUE ACIDENTAL (5 segundos por ID único de requisição)
    var cache = CacheService.getScriptCache();
    var idInspecao = data.id ? String(data.id) : (nomeAutor + "_" + (data.numeroProcesso || "") + "_" + (data.dataVistoria || "") + "_" + (data.numeroVistoria || "1") + "_" + Date.now());
    var cacheKey = "proc_" + idInspecao.replace(/[^a-zA-Z0-9_]/g, "");

    if (cache.get(cacheKey) === "processando") {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "sucesso", 
        message: "Uma requisição idêntica já está sendo processada no momento.",
        perito: config.nome,
        duplicatePrevented: true
      })).setMimeType(ContentService.MimeType.JSON);
    }
    cache.put(cacheKey, "processando", 5);
    
    // 1. Cria nova pasta no Google Drive do Perito com versionamento, data e número da vistoria
    var targetMainFolderId = mainFolderId || (config && config.mainFolderId) || "1dIFg4HCfX0C3cG_8WrbFK5PHETt6VUQV";
    var mainFolder = DriveApp.getFolderById(targetMainFolderId);
    
    var dataVistoriaFormatada = "";
    if (data.dataVistoria) {
      var partesDate = data.dataVistoria.toString().split("-");
      if (partesDate.length === 3) {
        dataVistoriaFormatada = partesDate[2] + "-" + partesDate[1] + "-" + partesDate[0];
      } else {
        dataVistoriaFormatada = data.dataVistoria.toString().split("/").join("-");
      }
    }
    
    var numVistoriaStr = (data.numeroVistoria && String(data.numeroVistoria) !== "1") ? (" - Vistoria " + data.numeroVistoria) : "";
    var pastaVistoriaNome = dataVistoriaFormatada ? (dataVistoriaFormatada + " - " + nomeAutor + numVistoriaStr) : (nomeAutor + numVistoriaStr);
    var inspectionFolder = criarPastaVistoriaComVersionamento(mainFolder, pastaVistoriaNome);
    
    var subfolderImovel = criarOuObterPasta(inspectionFolder, "Fotos da Residência");
    var subfolderMedidor = criarOuObterPasta(inspectionFolder, "Fotos do Medidor");
    
    // 2. Gravação IMEDIATA na Planilha de Vistorias na aba "Energia" (Garantida no início)
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
    
    // Gravação 100% DINÂMICA na planilha e flush imediato
    var linhaGravadaIndex = gravarLinhaVistoriaDinamica(sheet, data, nomeAutor, inspectionFolder.getUrl(), "");
    SpreadsheetApp.flush();

    // 3. Salva Fotografias em Base64 na pasta do Google Drive
    var urlsFotosImovel = [];
    if (data.photosImovel && Array.isArray(data.photosImovel) && data.photosImovel.length > 0) {
      urlsFotosImovel = salvarFotosBase64(data.photosImovel, subfolderImovel, "Imovel_");
    }
    
    var urlsFotosMedidor = [];
    if (data.photosMedidor && Array.isArray(data.photosMedidor) && data.photosMedidor.length > 0) {
      urlsFotosMedidor = salvarFotosBase64(data.photosMedidor, subfolderMedidor, "Medidor_");
    }

    // Se for um reenvio sem fotos no payload, mas com o link da pasta anterior do Drive:
    // Copia as fotos da pasta original do Drive e prepara o base64 para o Laudo LaTeX
    var pastaOrigemUrl = data.pastaOrigemUrl || data.linkDaPastaOrigem || "";
    if ((urlsFotosImovel.length === 0 && urlsFotosMedidor.length === 0) && pastaOrigemUrl) {
      copiarFotosDaPastaOrigem(pastaOrigemUrl, subfolderImovel, subfolderMedidor, data);
    }

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
    var extraido = null;
    
    if (sheetProcessosRef) {
      extraido = extrairDadosPreVistoriaDinamico(sheetProcessosRef, data.numeroProcesso, nomeAutor, data.dataVistoria);
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

        var dadosVistoriaSemFotos = {
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
          notificacaoPreviaCorte: data.notificacaoPreviaCorte || "Não",
          observacoesMedidor: data.observacoesMedidor || "",
          representacaoAutor: data.representacaoAutor || "Presente",
          representacaoReu: data.representacaoReu || "Ausente",
          observacoesPresenca: data.observacoesPresenca || "",
          observacoesFinais: data.observacoesFinais || ""
        };

        // --- ETAPA 1: IA Gemini redige as respostas e prepara arquivos .TeX / .CSV (~6 a 12s) ---
        var respostasQuesitos = {
          quesitosDoJuizo: dadosProcesso.quesitosJuizo || "",
          quesitosDoAutor: dadosProcesso.quesitosAutor || "",
          quesitosDoReu: dadosProcesso.quesitosReu || ""
        };

        try {
          // Warm-up prévio do microserviço para eliminar cold-start de bundles
          try {
            UrlFetchApp.fetch(MICROSERVICE_LATEX_BASE_URL + "/health", { muteHttpExceptions: true });
          } catch (eWarm) {}

          var totalQ = contarQuesitosEstimados(dadosProcesso);
          console.log("[Quesitos] Quantidade estimada de itens a responder: " + totalQ);

          if (totalQ > 6) {
            console.log("[Quesitos] Volume alto detectado (" + totalQ + " itens). Dividindo em requisições modulares por parte para evitar timeout...");

            // 1. Juízo
            try {
              var rJ = UrlFetchApp.fetch(MICROSERVICE_LATEX_BASE_URL + "/api/responder-quesitos", {
                method: "post",
                contentType: "application/json",
                payload: JSON.stringify({ processo: dadosProcesso, vistoria: dadosVistoriaSemFotos, parte: "juizo" }),
                muteHttpExceptions: true
              });
              var jJ = JSON.parse(rJ.getContentText());
              if (jJ && jJ.respostas && jJ.respostas.quesitosDoJuizo) {
                respostasQuesitos.quesitosDoJuizo = jJ.respostas.quesitosDoJuizo;
              }
            } catch (eJ) {
              console.warn("Aviso ao responder Juízo modular:", eJ.toString());
            }

            Utilities.sleep(1500);

            // 2. Autor
            try {
              var rA = UrlFetchApp.fetch(MICROSERVICE_LATEX_BASE_URL + "/api/responder-quesitos", {
                method: "post",
                contentType: "application/json",
                payload: JSON.stringify({ processo: dadosProcesso, vistoria: dadosVistoriaSemFotos, parte: "autor" }),
                muteHttpExceptions: true
              });
              var jA = JSON.parse(rA.getContentText());
              if (jA && jA.respostas && jA.respostas.quesitosDoAutor) {
                respostasQuesitos.quesitosDoAutor = jA.respostas.quesitosDoAutor;
              }
            } catch (eA) {
              console.warn("Aviso ao responder Autor modular:", eA.toString());
            }

            Utilities.sleep(1500);

            // 3. Réu
            try {
              var rR = UrlFetchApp.fetch(MICROSERVICE_LATEX_BASE_URL + "/api/responder-quesitos", {
                method: "post",
                contentType: "application/json",
                payload: JSON.stringify({ processo: dadosProcesso, vistoria: dadosVistoriaSemFotos, parte: "reu" }),
                muteHttpExceptions: true
              });
              var jR = JSON.parse(rR.getContentText());
              if (jR && jR.respostas && jR.respostas.quesitosDoReu) {
                respostasQuesitos.quesitosDoReu = jR.respostas.quesitosDoReu;
              }
            } catch (eR) {
              console.warn("Aviso ao responder Réu modular:", eR.toString());
            }
          } else {
            // Processo com volume normal: requisição única
            var payloadQuesitos = {
              processo: dadosProcesso,
              vistoria: dadosVistoriaSemFotos,
              parte: "tudo"
            };
            var respQuesitosHttp = UrlFetchApp.fetch(MICROSERVICE_LATEX_BASE_URL + "/api/responder-quesitos", {
              method: "post",
              contentType: "application/json",
              payload: JSON.stringify(payloadQuesitos),
              muteHttpExceptions: true
            });
            var jsonQuesitos = JSON.parse(respQuesitosHttp.getContentText());
            if (jsonQuesitos && jsonQuesitos.respostas) {
              respostasQuesitos = jsonQuesitos.respostas;
            }
          }
        } catch (errQ) {
          console.warn("Aviso ao responder quesitos com Gemini (usando fallback):", errQ.toString());
        }

        // --- ETAPA 2: Compilação do PDF Oficial com Tectonic XeTeX (~12 a 25s) ---
        // Prepara fotos ultraleves para compilação do PDF (apenas pdfBase64, removendo o base64 pesado de 1440px)
        var photosImovelCompact = (data.photosImovel || []).map(function(p) {
          return {
            name: p.name || "foto_imovel.jpg",
            base64: p.pdfBase64 || p.base64 || ""
          };
        });
        var photosMedidorCompact = (data.photosMedidor || []).map(function(p) {
          return {
            name: p.name || "foto_medidor.jpg",
            base64: p.pdfBase64 || p.base64 || ""
          };
        });

        var payloadCompilacao = Object.assign({}, dadosProcesso, dadosVistoriaSemFotos, {
          photosImovel: photosImovelCompact,
          photosMedidor: photosMedidorCompact,
          quesitosDoJuizo: respostasQuesitos.quesitosDoJuizo || respostasQuesitos.quesitos_juizo,
          quesitosDoAutor: respostasQuesitos.quesitosDoAutor || respostasQuesitos.quesitos_autor,
          quesitosDoReu: respostasQuesitos.quesitosDoReu || respostasQuesitos.quesitos_reu,
          returnBase64: true
        });

        // --- LOG DE PAYLOAD PARA A VERCEL ---
        var payloadCompilacaoJson = JSON.stringify(payloadCompilacao);
        var payloadBytes = payloadCompilacaoJson.length;
        console.log("[Compilação LaTeX] Tamanho do payload para Vercel: " + (payloadBytes / 1024).toFixed(1) + " KB (" + photosImovelCompact.length + " fotos imovel, " + photosMedidorCompact.length + " fotos medidor)");

        var respCompilacaoHttp = UrlFetchApp.fetch(MICROSERVICE_LATEX_BASE_URL + "/api/compilar-laudo", {
          method: "post",
          contentType: "application/json",
          payload: payloadCompilacaoJson,
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
    "notificacaopreviacorte": data.notificacaoPreviaCorte || "Não",
    "notificacaoprevia": data.notificacaoPreviaCorte || "Não",
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
 * Executa a migração completa e oficial da vistoria legada:
 * 1. Cria a pasta da vistoria no Google Drive do Perito com subpastas Fotos da Residência e Fotos do Medidor
 * 2. Grava ou atualiza a linha na aba Energia da Planilha Oficial com o link da pasta do Drive
 * 3. Cruza com Processos Energia e dispara requisição ao microserviço para responder quesitos com Gemini
 * 4. Salva dados.tex e historico_consumo.csv na pasta do Drive
 * 5. Atualiza o status em Processos Energia para "Vistoriado"
 */
function processarMigracaoVistoriaLegadaCompleta(ss, config, objVistoria, autorCap, numProcLimpo, mainFolderId) {
  // 1. Cria ou localiza a pasta no Google Drive oficial do perito
  var targetMainFolderId = mainFolderId || (config && config.mainFolderId) || "1dIFg4HCfX0C3cG_8WrbFK5PHETt6VUQV";
  var mainFolder = DriveApp.getFolderById(targetMainFolderId);

  var dataVistFormatada = "";
  if (objVistoria.dataVistoria) {
    var pD = objVistoria.dataVistoria.toString().split("-");
    if (pD.length === 3) {
      dataVistFormatada = pD[2] + "-" + pD[1] + "-" + pD[0];
    } else {
      dataVistFormatada = objVistoria.dataVistoria.toString().split("/").join("-");
    }
  }

  var numVistStr = (objVistoria.numeroVistoria && String(objVistoria.numeroVistoria) !== "1") ? (" - Vistoria " + objVistoria.numeroVistoria) : "";
  var pastaVistoriaNome = dataVistFormatada ? (dataVistFormatada + " - " + autorCap + numVistStr) : (autorCap + numVistStr);

  var inspectionFolder = null;
  var pastasEx = mainFolder.getFoldersByName(pastaVistoriaNome);
  if (pastasEx.hasNext()) {
    inspectionFolder = pastasEx.next();
  } else {
    inspectionFolder = criarPastaVistoriaComVersionamento(mainFolder, pastaVistoriaNome);
  }

  // Cria subpastas para que o usuário possa subir fotos pelo dossiê / Drive
  var subfolderImovel = criarOuObterPasta(inspectionFolder, "Fotos da Residência");
  var subfolderMedidor = criarOuObterPasta(inspectionFolder, "Fotos do Medidor");
  var folderUrl = inspectionFolder.getUrl();
  var folderId = inspectionFolder.getId();
  objVistoria.linkDrive = folderUrl;

  // 2. Grava ou atualiza a linha na aba Energia da Planilha Oficial
  var sheetEnergia = buscarAbaFlexivel(ss, "Energia") || buscarAbaFlexivel(ss, "Respostas ao formulário 1") || ss.getSheets()[0];
  var dataEnergia = sheetEnergia.getDataRange().getDisplayValues();
  var headersEnergia = dataEnergia.length > 0 ? dataEnergia[0] : [];
  var colLinkDrive = acharIndiceColuna(headersEnergia, ["linkdapastagoogledrive", "linkdapasta", "pastadrive", "linkdrive"]);
  var linhaExistente = -1;

  var procDig = numProcLimpo.replace(/[^0-9]/g, "");
  var autLimpo = autorCap.toLowerCase().trim();

  if (dataEnergia.length > 1) {
    for (var eI = 1; eI < dataEnergia.length; eI++) {
      var rE = dataEnergia[eI];
      var rAut = rE[1] ? String(rE[1]).toLowerCase().trim() : "";
      var rProc = rE[2] ? String(rE[2]).replace(/[^0-9]/g, "") : "";
      if ((procDig && rProc && procDig === rProc) || (autLimpo && rAut && autLimpo === rAut)) {
        linhaExistente = eI + 1;
        break;
      }
    }
  }

  if (linhaExistente > 0) {
    if (colLinkDrive >= 0) {
      sheetEnergia.getRange(linhaExistente, colLinkDrive + 1).setValue(folderUrl);
    }
  } else {
    gravarLinhaVistoriaDinamica(sheetEnergia, objVistoria, autorCap, folderUrl, "");
  }
  SpreadsheetApp.flush();

  // 3. Cruzamento com a aba Processos Energia e Chamada ao Microserviço para Responder Quesitos
  var sheetProcessosRef = buscarAbaFlexivel(ss, "Processos Energia") || buscarAbaFlexivel(ss, "Processos");
  var extraido = null;
  if (sheetProcessosRef) {
    extraido = extrairDadosPreVistoriaDinamico(sheetProcessosRef, numProcLimpo, autorCap, objVistoria.dataVistoria);
  }

  var respostasQuesitos = {
    quesitosDoJuizo: (extraido && extraido.dados && extraido.dados.quesitosJuizo) || "",
    quesitosDoAutor: (extraido && extraido.dados && extraido.dados.quesitosAutor) || "",
    quesitosDoReu: (extraido && extraido.dados && extraido.dados.quesitosReu) || ""
  };

  var jsonQ = null;
  if (extraido && extraido.dados) {
    var dadosProc = Object.assign({
      peritoNome: config.nome,
      peritoTituloLinhaA: config.tituloLinhaA,
      peritoTituloLinhaB: config.tituloLinhaB,
      peritoRegistroRotulo: config.registroRotulo,
      peritoRegistroNumero: config.registroNumero,
      peritoTelefone: config.telefone,
      peritoEmail: config.email,
      nomeAutor: autorCap,
      numeroProcesso: numProcLimpo,
      reuConcessionaria: objVistoria.reuConcessionaria || "",
      tipoAcao: objVistoria.tipoAcao || "Consumo"
    }, extraido.dados);

    // Chama o microserviço para responder quesitos com Gemini
    try {
      try { UrlFetchApp.fetch(MICROSERVICE_LATEX_BASE_URL + "/health", { muteHttpExceptions: true }); } catch (eW) {}

      var payloadQ = {
        processo: dadosProc,
        vistoria: objVistoria,
        parte: "tudo"
      };
      var respQ = UrlFetchApp.fetch(MICROSERVICE_LATEX_BASE_URL + "/api/responder-quesitos", {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payloadQ),
        muteHttpExceptions: true
      });
      jsonQ = JSON.parse(respQ.getContentText());
      if (jsonQ && jsonQ.respostas) {
        respostasQuesitos = jsonQ.respostas;
      }
      if (jsonQ && jsonQ.dadosTex && !inspectionFolder.getFilesByName("dados.tex").hasNext()) {
        inspectionFolder.createFile(Utilities.newBlob(jsonQ.dadosTex, "text/plain; charset=utf-8", "dados.tex"));
      }
      if (jsonQ && jsonQ.historicoCsv && !inspectionFolder.getFilesByName("historico_consumo.csv").hasNext()) {
        inspectionFolder.createFile(Utilities.newBlob(jsonQ.historicoCsv, "text/csv; charset=utf-8", "historico_consumo.csv"));
      }
    } catch (errQ) {
      console.warn("Aviso ao responder quesitos no microserviço:", errQ.toString());
    }

    // Salva historico_consumo.csv se houver na pré-vistoria e ainda não estiver salvo na pasta
    if (extraido.dados.historicoConsumoCsv && !inspectionFolder.getFilesByName("historico_consumo.csv").hasNext()) {
      inspectionFolder.createFile(Utilities.newBlob(extraido.dados.historicoConsumoCsv, "text/csv; charset=utf-8", "historico_consumo.csv"));
    }

    // Atualiza status e link da pasta na aba Processos Energia para Vistoriado
    if (extraido.linhaIndex > 0 && extraido.colunaStatus > 0) {
      sheetProcessosRef.getRange(extraido.linhaIndex, extraido.colunaStatus).setValue("Vistoriado");
    }
    if (extraido.linhaIndex > 0 && extraido.colunaLink > 0) {
      sheetProcessosRef.getRange(extraido.linhaIndex, extraido.colunaLink).setValue(folderUrl);
    }
  }

  return {
    status: "sucesso",
    gravado: true,
    folderUrl: folderUrl,
    folderId: folderId,
    respostasQuesitos: respostasQuesitos,
    preVistoria: extraido ? extraido.dados : null,
    dadosTex: jsonQ ? jsonQ.dadosTex : null,
    historicoCsv: jsonQ ? jsonQ.historicoCsv : null,
    message: "Vistoria gravada na aba Energia, pasta criada no Drive e quesitos respondidos pela IA!",
    processo: numProcLimpo
  };
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

function acharIndiceColuna(headersArray, aliases, exclusions) {
  if (!headersArray || !aliases) return -1;
  var excluidos = (exclusions || []).concat(["secao", "seçao", "identificacao", "vincular"]);

  // 1. Pass: Correspondência Exata
  for (var i = 0; i < headersArray.length; i++) {
    var hLimpo = String(headersArray[i] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (!hLimpo) continue;

    var ehExcluido = false;
    for (var e = 0; e < excluidos.length; e++) {
      var eLimpo = excluidos[e].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      if (hLimpo.indexOf(eLimpo) !== -1) {
        ehExcluido = true;
        break;
      }
    }
    if (ehExcluido) continue;

    for (var a = 0; a < aliases.length; a++) {
      var aLimpo = aliases[a].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      if (hLimpo === aLimpo) return i;
    }
  }

  // 2. Pass: Começa com alias ou contém alias de pelo menos 4 caracteres (sem estar nos excluídos)
  for (var i = 0; i < headersArray.length; i++) {
    var hLimpo = String(headersArray[i] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (!hLimpo) continue;

    var ehExcluido = false;
    for (var e = 0; e < excluidos.length; e++) {
      var eLimpo = excluidos[e].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      if (hLimpo.indexOf(eLimpo) !== -1) {
        ehExcluido = true;
        break;
      }
    }
    if (ehExcluido) continue;

    for (var a = 0; a < aliases.length; a++) {
      var aLimpo = aliases[a].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      if (aLimpo.length >= 4 && hLimpo.indexOf(aLimpo) !== -1) return i;
    }
  }

  return -1;
}

/**
 * Extrai dados da aba "Processos Energia" dinamicamente pelas 26 colunas oficiais
 */
function extrairDadosPreVistoriaDinamico(sheetProcessos, numeroProcessoBuscado, nomeAutorBuscado, dataVistoriaBuscada) {
  var dataRange = sheetProcessos.getDataRange().getDisplayValues();
  if (dataRange.length <= 1) return null;

  var headers = dataRange[0];

  var colData = acharIndiceColuna(headers, ["datadavistoria", "datavistoria", "dataagendada", "dataagendamento", "dataagenda", "agendamento", "data", "dia"]);
  if (colData < 0 && headers.length > 0) {
    var h0 = String(headers[0] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (h0.indexOf("data") !== -1 || h0.indexOf("dia") !== -1 || h0.indexOf("agenda") !== -1) {
      colData = 0;
    }
  }
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
  var colCsv = acharIndiceColuna(headers, ["historicoconsumocsv", "historicocsv", "faturascsv", "csvconsumo", "csv", "consumocsv"]);
  var colQJuizo = acharIndiceColuna(headers, ["quesitosdojuizobrutos", "quesitosdojuizo", "quesitosjuizo", "quesitosdojuiz", "quesitosjuiz", "quesitosjuizobruto", "perguntasdojuizo", "juizobrutos", "juizobruto", "quesitosjudiciais", "quesitosdojuizoformatado", "quesitosdojuizotexto", "pontoscontrovertidos", "pontoscontrovertidosjuizo", "decisaosaneadora", "saneador", "juizo", "quesitos"]);
  var colQAutor = acharIndiceColuna(headers, ["quesitosdoautorbrutos", "quesitosdoautor", "quesitosautor", "quesitosdaautora", "quesitosautora", "quesitosautorbruto", "perguntasdoautor", "autorbrutos", "autorbruto", "quesitosdoautorformatado", "quesitosdoautortexto"]);
  var colQReu = acharIndiceColuna(headers, ["quesitosdoreubrutos", "quesitosdoreu", "quesitosreu", "quesitosdare", "quesitosre", "quesitosreubruto", "perguntasdoreu", "reubrutos", "reubruto", "quesitosdoreuformatado", "quesitosdoreutexto", "quesitosdareu"]);
  var colStatus = acharIndiceColuna(headers, ["statusdaautomacao", "status", "situacao"]);
  var colLink = acharIndiceColuna(headers, ["linkdolaudopdf", "laudopdf", "linklaudo", "laudo"]);

  var procBuscadoLimpo = numeroProcessoBuscado ? numeroProcessoBuscado.toString().replace(/[^0-9]/g, "") : "";
  var autorBuscadoLimpo = nomeAutorBuscado ? nomeAutorBuscado.toString().toLowerCase().trim() : "";
  var dataBuscadaLimpa = dataVistoriaBuscada ? dataVistoriaBuscada.toString().trim() : "";

  var rowTarget = null;
  var linhaEncontradaIndex = -1;

  for (var i = 1; i < dataRange.length; i++) {
    var r = dataRange[i];
    var pVal = colProc >= 0 ? String(r[colProc] || "").replace(/[^0-9]/g, "") : "";
    var aVal = colAutor >= 0 ? String(r[colAutor] || "").toLowerCase().trim() : "";
    var dVal = colData >= 0 ? String(r[colData] || "").trim() : "";

    // Se processo e data baterem exatamente, dá prioridade máxima
    if (procBuscadoLimpo && pVal && pVal === procBuscadoLimpo) {
      if (dataBuscadaLimpa && dVal && (dVal.indexOf(dataBuscadaLimpa) !== -1 || dataBuscadaLimpa.indexOf(dVal) !== -1)) {
        rowTarget = r;
        linhaEncontradaIndex = i + 1;
        break;
      }
      if (!rowTarget) {
        rowTarget = r;
        linhaEncontradaIndex = i + 1;
      }
    } else if (autorBuscadoLimpo && aVal && (aVal === autorBuscadoLimpo || aVal.indexOf(autorBuscadoLimpo) !== -1 || autorBuscadoLimpo.indexOf(aVal) !== -1)) {
      if (!rowTarget) {
        rowTarget = r;
        linhaEncontradaIndex = i + 1;
      }
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
        dataVistoria: colData >= 0 ? String(rowTarget[colData] || "") : "",
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
  var count = 2;
  while (count <= 50) {
    var nomeVersao = baseName + " (Versão " + count + ")";
    var busca = parentFolder.getFoldersByName(nomeVersao);
    if (!busca.hasNext()) {
      return parentFolder.createFolder(nomeVersao);
    }
    count++;
  }
  return parentFolder.createFolder(baseName + " (" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HHmmss") + ")");
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

function extrairFolderId(url) {
  if (!url) return null;
  var str = String(url).trim();
  var match = str.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  var matchId = str.match(/id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(str)) return str;
  return null;
}

function localizarPastaVistoriaDrive(ss, config, folderUrl, processo, autor, mainFolderId) {
  var folderId = extrairFolderId(folderUrl);
  if (folderId) {
    try {
      var folder = DriveApp.getFolderById(folderId);
      if (folder) return folder;
    } catch (_) {}
  }

  var procLimpo = String(processo || "").replace(/[^0-9]/g, "");
  var autorLimpo = autor ? capitalizarNome(autor).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") : "";

  // 1. Busca link da pasta gravada na aba Energia da Planilha Oficial
  if (ss) {
    try {
      var sheetEnergia = buscarAbaFlexivel(ss, "Energia") || buscarAbaFlexivel(ss, "Respostas ao formulário 1") || ss.getSheets()[0];
      if (sheetEnergia) {
        var dataE = sheetEnergia.getDataRange().getDisplayValues();
        var headersE = dataE.length > 0 ? dataE[0] : [];
        var colLink = acharIndiceColuna(headersE, ["linkdapastagoogledrive", "linkdapasta", "pastadrive", "linkdrive"]);
        if (colLink >= 0 && dataE.length > 1) {
          for (var i = 1; i < dataE.length; i++) {
            var r = dataE[i];
            var rProc = r[2] ? String(r[2]).replace(/[^0-9]/g, "") : "";
            var rAut = r[1] ? String(r[1]).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") : "";
            if ((procLimpo && rProc && rProc === procLimpo) || (autorLimpo && rAut && (rAut.indexOf(autorLimpo) !== -1 || autorLimpo.indexOf(rAut) !== -1))) {
              var lUrl = r[colLink];
              var fId = extrairFolderId(lUrl);
              if (fId) {
                try {
                  var f = DriveApp.getFolderById(fId);
                  if (f) return f;
                } catch (_) {}
              }
            }
          }
        }
      }
    } catch (_) {}

    // 2. Busca link da pasta gravada na aba Processos Energia
    try {
      var sheetProc = buscarAbaFlexivel(ss, "Processos Energia") || buscarAbaFlexivel(ss, "Processos");
      if (sheetProc) {
        var dataP = sheetProc.getDataRange().getDisplayValues();
        var headersP = dataP.length > 0 ? dataP[0] : [];
        var colLinkP = acharIndiceColuna(headersP, ["linkdapastadodrive", "pastadodrive", "linkdrive", "link"]);
        if (colLinkP >= 0 && dataP.length > 1) {
          for (var j = 1; j < dataP.length; j++) {
            var rp = dataP[j];
            var colProcP = acharIndiceColuna(headersP, ["numerodoprocesso", "processo", "cnj"]);
            var rpProc = colProcP >= 0 && rp[colProcP] ? String(rp[colProcP]).replace(/[^0-9]/g, "") : "";
            if (procLimpo && rpProc && rpProc === procLimpo) {
              var lUrlP = rp[colLinkP];
              var fIdP = extrairFolderId(lUrlP);
              if (fIdP) {
                try {
                  var fP = DriveApp.getFolderById(fIdP);
                  if (fP) return fP;
                } catch (_) {}
              }
            }
          }
        }
      }
    } catch (_) {}
  }

  // 3. Busca pasta pelo nome do autor dentro da pasta raiz do perito
  var targetMainId = mainFolderId || (config && config.mainFolderId) || "1dIFg4HCfX0C3cG_8WrbFK5PHETt6VUQV";
  if (targetMainId && autorLimpo && autorLimpo.length > 3) {
    try {
      var mainFolder = DriveApp.getFolderById(targetMainId);
      if (mainFolder) {
        var subPastas = mainFolder.getFolders();
        while (subPastas.hasNext()) {
          var sub = subPastas.next();
          var sNome = sub.getName().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (sNome.indexOf(autorLimpo) !== -1) {
            return sub;
          }
        }
      }
    } catch (_) {}
  }

  return null;
}

function extrairFotosDePastaDrive(targetFolder) {
  var result = { photosImovel: [], photosMedidor: [] };
  if (!targetFolder) return result;

  var processarArquivoFoto = function(file, pastaCategoriaHint) {
    try {
      var mime = (file.getMimeType() || "").toLowerCase();
      var name = file.getName();
      var isImg = mime.indexOf("image") !== -1 || mime.indexOf("octet-stream") !== -1 || name.match(/\.(jpe?g|png|webp|heic)$/i);
      if (!isImg) return;

      var b64 = obterThumbnailUltraLeveBase64(file);
      var fileId = file.getId();
      var nameLower = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      var isFachada = nameLower.indexOf("fachada") !== -1;
      var isMedidor = !isFachada && ((pastaCategoriaHint === "medidor") ||
        nameLower.indexOf("medid") !== -1 ||
        nameLower.indexOf("relog") !== -1 ||
        nameLower.indexOf("lacre") !== -1 ||
        nameLower.indexOf("padrao") !== -1);

      var item = {
        id: fileId,
        name: name,
        type: mime.indexOf("image") !== -1 ? mime : "image/jpeg",
        base64: b64 ? ("data:image/jpeg;base64," + b64) : "",
        url: "https://drive.google.com/uc?export=view&id=" + fileId,
        isFachada: isFachada
      };

      if (isMedidor) {
        result.photosMedidor.push(item);
      } else {
        result.photosImovel.push(item);
      }
    } catch (eProc) {
      console.warn("Erro ao processar foto " + file.getName() + ": " + eProc.toString());
    }
  };

  // 1. Vasculha todas as subpastas flexivelmente (qualquer nome)
  try {
    var subFolders = targetFolder.getFolders();
    while (subFolders.hasNext()) {
      var sub = subFolders.next();
      var sName = sub.getName().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      var hint = (sName.indexOf("medid") !== -1 || sName.indexOf("relog") !== -1 || sName.indexOf("lacre") !== -1)
        ? "medidor"
        : "imovel";

      var fIter = sub.getFiles();
      while (fIter.hasNext()) {
        processarArquivoFoto(fIter.next(), hint);
      }
    }
  } catch (eSub) {
    console.warn("Erro ao listar subpastas:", eSub.toString());
  }

  // 2. Vasculha arquivos soltos na raiz da pasta da vistoria
  try {
    var rIter = targetFolder.getFiles();
    while (rIter.hasNext()) {
      processarArquivoFoto(rIter.next(), "auto");
    }
  } catch (eRoot) {
    console.warn("Erro ao listar arquivos da raiz:", eRoot.toString());
  }

  return result;
}

function obterThumbnailUltraLeveBase64(file) {
  if (!file) return "";
  var fileId = file.getId();

  // 1. Prioridade absoluta: Thumbnail nativo pré-otimizado do Google Drive (~800px, ~50-80KB)
  try {
    var thumb = file.getThumbnail();
    if (thumb) {
      var tBytes = thumb.getBytes();
      if (tBytes && tBytes.length > 0) {
        return Utilities.base64Encode(tBytes);
      }
    }
  } catch (eThumb) {}

  // 2. Segundo recurso: Fallback CDN com largura 1000px do Google Drive
  try {
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eS) {}
    var thumbUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000";
    var resp = UrlFetchApp.fetch(thumbUrl, { muteHttpExceptions: true });
    if (resp.getResponseCode() === 200) {
      var cdnBytes = resp.getBlob().getBytes();
      if (cdnBytes && cdnBytes.length > 500) {
        return Utilities.base64Encode(cdnBytes);
      }
    }
  } catch (eCdn) {}

  // 3. Terceiro recurso: Se não houver thumbnail e o arquivo for pequeno (< 1.5MB), lê bytes originais
  try {
    var size = file.getSize();
    if (size <= 1500000) {
      var blob = file.getBlob();
      var bytes = blob.getBytes();
      if (bytes && bytes.length > 0) {
        return Utilities.base64Encode(bytes);
      }
    }
  } catch (eBlob) {}

  return "";
}

function copiarFotosDaPastaOrigem(pastaOrigemUrl, targetSubfolderImovel, targetSubfolderMedidor, dataObj) {
  try {
    var folderId = extrairFolderId(pastaOrigemUrl);
    if (!folderId) return;
    
    var pastaOrigem = DriveApp.getFolderById(folderId);
    if (!pastaOrigem) return;

    if (!dataObj.photosImovel) dataObj.photosImovel = [];
    if (!dataObj.photosMedidor) dataObj.photosMedidor = [];

    // 1. Copia fotos da Residência da pasta original para a nova versão
    var subPastasResidencia = pastaOrigem.getFoldersByName("Fotos da Residência");
    if (subPastasResidencia.hasNext()) {
      var origSubRes = subPastasResidencia.next();
      var files = origSubRes.getFiles();
      while (files.hasNext()) {
        var file = files.next();
        var mime = file.getMimeType();
        if (mime.indexOf("image") !== -1 || mime.indexOf("jpeg") !== -1 || mime.indexOf("png") !== -1 || mime.indexOf("octet-stream") !== -1) {
          var copiedFile = file.makeCopy(file.getName(), targetSubfolderImovel);
          var b64 = obterThumbnailUltraLeveBase64(copiedFile || file);
          if (b64) {
            dataObj.photosImovel.push({
              name: file.getName(),
              base64: b64,
              pdfBase64: b64
            });
          }
        }
      }
    }

    // 2. Copia fotos do Medidor da pasta original para a nova versão
    var subPastasMedidor = pastaOrigem.getFoldersByName("Fotos do Medidor");
    if (subPastasMedidor.hasNext()) {
      var origSubMed = subPastasMedidor.next();
      var filesM = origSubMed.getFiles();
      while (filesM.hasNext()) {
        var fileM = filesM.next();
        var mimeM = fileM.getMimeType();
        if (mimeM.indexOf("image") !== -1 || mimeM.indexOf("jpeg") !== -1 || mimeM.indexOf("png") !== -1 || mimeM.indexOf("octet-stream") !== -1) {
          var copiedFileM = fileM.makeCopy(fileM.getName(), targetSubfolderMedidor);
          var b64M = obterThumbnailUltraLeveBase64(copiedFileM || fileM);
          if (b64M) {
            dataObj.photosMedidor.push({
              name: fileM.getName(),
              base64: b64M,
              pdfBase64: b64M
            });
          }
        }
      }
    }
    console.log("Fotos replicadas com sucesso da pasta de origem: " + dataObj.photosImovel.length + " do imóvel e " + dataObj.photosMedidor.length + " do medidor.");
  } catch (err) {
    console.warn("Erro ao copiar fotos da pasta de origem:", err.toString());
  }
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

function contarQuesitosEstimados(proc) {
  if (!proc) return 0;
  var total = 0;
  var campos = ['quesitosJuizo', 'quesitosAutor', 'quesitosReu'];
  for (var i = 0; i < campos.length; i++) {
    var txt = String(proc[campos[i]] || '').trim();
    if (txt.length > 15) {
      if (txt.indexOf('\n') !== -1) {
        total += txt.split(/\r?\n+/).filter(function(l) { return l.trim().length > 3; }).length;
      } else if (txt.indexOf(';') !== -1) {
        total += txt.split(/;/).filter(function(l) { return l.trim().length > 3; }).length;
      } else {
        var m = txt.match(/(?:\d+[\.\)\-]|[a-zA-Z][\.\)])\s+/g);
        total += m ? m.length : 1;
      }
    }
  }
  return total;
}
