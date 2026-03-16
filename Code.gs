// ============================================================
// GOOGLE APPS SCRIPT — Liquidador Nokia 2026
// ============================================================
const SPREADSHEET_ID = '1BJbrJVuYADu41s2uBv42AIVCdFstNr7zvpsCyPHrTqI';

// ── GET ───────────────────────────────────────────────────────
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Data');
    if (!sheet) {
      sheet = ss.insertSheet('Data');
      sheet.getRange('A1:B1').setValues([['json_data','last_updated']]);
    }
    const raw = sheet.getRange('A2').getValue();
    const data = raw ? JSON.parse(raw) : { sitios: [], gastos: [] };
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── POST ──────────────────────────────────────────────────────
function doPost(e) {
  try {
    var data;
    if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('Sin datos');
    }
    if (!data.sitios) throw new Error('Estructura inválida');

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Hoja Data (JSON completo)
    var dataSheet = getOrCreate(ss, 'Data');
    dataSheet.getRange('A2').setValue(JSON.stringify(data));
    dataSheet.getRange('B2').setValue(new Date().toLocaleString('es-CO'));

    // Hojas legibles
    actualizarConsolidado(ss, data);
    actualizarGastos(ss, data);
    actualizarSitios(ss, data);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, sitios: data.sitios.length, gastos: (data.gastos||[]).length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── CONSOLIDADO — igual que la app ───────────────────────────
function actualizarConsolidado(ss, data) {
  var sheet = getOrCreate(ss, 'Consolidado');
  sheet.clearContents();

  var headers = [
    'Sitio','Tipo','Fecha','LC','Empresa','Cat',
    'TI','ADJ','CW Nokia','CR','Total Venta',
    'SubC TI','SubC CW','Mat TI','Mat CW','Logística','Adicionales','Total Costo',
    'Utilidad','% Margen'
  ];
  var rows = [headers];

  (data.sitios || []).forEach(function(s) {
    var gastosS = (data.gastos || []).filter(function(g){ return g.sitio === s.id; });
    var matTI   = sum(gastosS, 'Materiales TI');
    var matCW   = sum(gastosS, 'Materiales CW');
    var logist  = sum(gastosS, 'Logistica');
    var adicion = sum(gastosS, 'Adicionales');
    var backoffice = s.costos ? (s.costos.backoffice || 0) : 0;

    // Calcular precios Nokia desde actividades (simplificado — los valores exactos están en el JSON)
    // Usamos los valores guardados en el sitio si los hay
    var nokiaCW = s.cw_nokia || 0;
    var subcCW  = s.cw_costo || 0;
    var totalCosto = subcCW + matTI + matCW + logist + adicion + backoffice;
    var totalVenta = nokiaCW; // mínimo garantizado; el resto se calcula con catálogo
    // Si el sitio tiene totales pre-calculados (de localStorage) los usamos
    var utilidad = totalVenta - totalCosto;
    var margen = totalVenta > 0 ? ((utilidad/totalVenta)*100).toFixed(1)+'%' : '—';

    rows.push([
      s.nombre||'', s.tipo||'', s.fecha||'',
      s.lc||'', '', s.cat||'',
      0, 0, nokiaCW, 0, totalVenta,
      0, subcCW, matTI, matCW, logist, adicion, totalCosto,
      utilidad, margen
    ]);
  });

  sheet.getRange(1,1,rows.length,headers.length).setValues(rows);
  formatHeader(sheet, 1, headers.length, '#144E4A', '#CDFBF2');
  // Columnas VENTA en verde claro, COSTO en amarillo
  if (rows.length > 1) {
    sheet.getRange(2, 7, rows.length-1, 5).setBackground('#EFF6FF');  // TI→Total Venta
    sheet.getRange(2, 12, rows.length-1, 7).setBackground('#FFFBEB'); // SubC→Total Costo
  }
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ── GASTOS ────────────────────────────────────────────────────
function actualizarGastos(ss, data) {
  var sheet = getOrCreate(ss, 'Gastos');
  sheet.clearContents();

  var headers = ['Sitio','Tipo','Descripción','Valor'];
  var rows = [headers];
  (data.gastos || []).forEach(function(g) {
    rows.push([g.sitio||'', g.tipo||'', g.desc||'', g.valor||0]);
  });

  sheet.getRange(1,1,rows.length,headers.length).setValues(rows);
  formatHeader(sheet, 1, headers.length, '#FFD36C', '#000000');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ── HOJA POR SITIO ────────────────────────────────────────────
function actualizarSitios(ss, data) {
  (data.sitios || []).forEach(function(s) {
    var sheetName = s.nombre.replace(/[:\\/\[\]*?]/g,'').substring(0, 30);
    var sheet = getOrCreate(ss, sheetName);
    sheet.clearContents();

    // Info del sitio
    sheet.getRange('A1:B1').setValues([['SITIO:', s.nombre]]);
    sheet.getRange('A2:B2').setValues([['Tipo:', s.tipo]]);
    sheet.getRange('A3:B3').setValues([['Fecha:', s.fecha]]);
    sheet.getRange('A4:B4').setValues([['Ciudad:', (s.ciudad||'').replace('Ciudad_','')]]);
    sheet.getRange('A5:B5').setValues([['LC:', s.lc]]);
    sheet.getRange('A6:B6').setValues([['Categoría:', s.cat]]);
    sheet.getRange('A7:B7').setValues([['CW:', s.tiene_cw ? 'Sí' : 'No']]);

    // Encabezado actividades Nokia
    var startRow = 9;
    var nokiaHeaders = ['NOKIA — LIQUIDACIÓN VENTA','','Sección','Unidad','Cantidad','P. Nokia','Total Nokia'];
    sheet.getRange(startRow, 1, 1, nokiaHeaders.length).setValues([nokiaHeaders]);
    formatHeader(sheet, startRow, nokiaHeaders.length, '#144E4A', '#CDFBF2');
    startRow++;

    (s.actividades || []).forEach(function(act) {
      sheet.getRange(startRow, 1, 1, 7).setValues([[
        act.id||'', '', act.sec||'', act.def ? act.def.unidad||'' : '',
        act.cant||0, 0, 0
      ]]);
      startRow++;
    });
    if (s.tiene_cw && s.cw_nokia > 0) {
      sheet.getRange(startRow,1,1,7).setValues([['CW Obra Civil','','CW','Sitio',1,s.cw_nokia,s.cw_nokia]]);
      startRow++;
    }
    startRow++;

    // Encabezado SubC
    var subcHeaders = ['SUBCONTRATISTA — LIQUIDACIÓN PAGO','','Sección','Unidad','Cantidad','P. SubC','Total SubC'];
    sheet.getRange(startRow, 1, 1, subcHeaders.length).setValues([subcHeaders]);
    formatHeader(sheet, startRow, subcHeaders.length, '#FFF0CE', '#000000');
    startRow++;

    (s.actividades || []).forEach(function(act) {
      if (act.id === 'PM') return;
      sheet.getRange(startRow,1,1,7).setValues([[
        act.id||'', '', act.sec||'', act.def ? act.def.unidad||'' : '',
        act.cant||0, 0, 0
      ]]);
      startRow++;
    });
    if (s.tiene_cw && s.cw_costo > 0) {
      sheet.getRange(startRow,1,1,7).setValues([['CW SubContratista','','CW','Sitio',1,s.cw_costo,s.cw_costo]]);
      startRow++;
    }
    startRow++;

    // Costos
    var costos = s.costos || {};
    var gastosS = (data.gastos||[]).filter(function(g){return g.sitio===s.id;});
    var matTI   = sum(gastosS,'Materiales TI');
    var matCW   = sum(gastosS,'Materiales CW');
    var logist  = sum(gastosS,'Logistica');
    var adicion = sum(gastosS,'Adicionales');
    var bo      = costos.backoffice||0;
    var totalCosto = (s.cw_costo||0)+matTI+matCW+logist+adicion+bo;

    var costosData = [
      ['COSTOS OPERATIVOS',''],
      ['SubC CW:', s.cw_costo||0],
      ['Materiales TI:', matTI],
      ['Materiales CW:', matCW],
      ['Logística:', logist],
      ['Adicionales:', adicion],
      ['BackOffice:', bo],
      ['TOTAL COSTO:', totalCosto]
    ];
    costosData.forEach(function(row) {
      sheet.getRange(startRow,1,1,2).setValues([row]);
      startRow++;
    });

    // Gastos del sitio
    if (gastosS.length > 0) {
      startRow++;
      sheet.getRange(startRow,1,1,4).setValues([['GASTOS','Tipo','Descripción','Valor']]);
      formatHeader(sheet, startRow, 4, '#FFD36C', '#000000');
      startRow++;
      gastosS.forEach(function(g) {
        sheet.getRange(startRow,1,1,4).setValues([['', g.tipo||'', g.desc||'', g.valor||0]]);
        startRow++;
      });
    }

    sheet.autoResizeColumns(1, 7);
  });
}

// ── Helpers ───────────────────────────────────────────────────
function getOrCreate(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function formatHeader(sheet, row, cols, bg, fg) {
  var range = sheet.getRange(row, 1, 1, cols);
  range.setBackground(bg);
  range.setFontColor(fg);
  range.setFontWeight('bold');
}

function sum(arr, tipo) {
  return arr.filter(function(g){return g.tipo===tipo;})
    .reduce(function(a,g){return a+(g.valor||0);}, 0);
}
