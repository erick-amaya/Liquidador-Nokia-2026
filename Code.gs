// ============================================================
// GOOGLE APPS SCRIPT — Backend para Liquidador Nokia 2026
// ============================================================
// INSTRUCCIONES DE INSTALACIÓN:
// 1. Abre https://script.google.com
// 2. Crea un nuevo proyecto → pega todo este código
// 3. En Extensions > Resources > Advanced Google Services: asegúrate que Sheets API esté ON
// 4. Clic en "Deploy" > "New deployment" > tipo "Web app"
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copia la URL generada y pégala en el HTML como GAS_URL
// ============================================================

const SPREADSHEET_ID = '1BJbrJVuYADu41s2uBv42AIVCdFstNr7zvpsCyPHrTqI'; // ← Reemplaza con el ID de tu Google Sheet
const SHEET_NAME = 'Data';

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange('A1').setValue('json_data');
    sheet.getRange('B1').setValue('last_updated');
  }
  return sheet;
}

// GET — retorna los datos actuales
function doGet(e) {
  try {
    const action = e.parameter.action || 'get';
    if (action === 'get') {
      const sheet = getSheet();
      const raw = sheet.getRange('A2').getValue();
      const data = raw ? JSON.parse(raw) : { sitios: [], gastos: [] };
      return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// POST — guarda los datos
function doPost(e) {
  try {
    const body = e.postData.contents;
    const data = JSON.parse(body);
    
    // Validar que tenga la estructura correcta
    if (!data.sitios) throw new Error('Datos inválidos');
    
    const sheet = getSheet();
    sheet.getRange('A2').setValue(JSON.stringify(data));
    sheet.getRange('B2').setValue(new Date().toISOString());
    
    // Actualizar hoja "Consolidado" con tabla legible
    actualizarConsolidado(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, ts: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Actualiza una hoja "Consolidado" con datos legibles
function actualizarConsolidado(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Consolidado');
  if (!sheet) sheet = ss.insertSheet('Consolidado');
  
  sheet.clearContents();
  
  const headers = ['Sitio','Tipo','Fecha','Ciudad','LC','Categoría',
    'Venta TI','Venta ADJ','Venta CW','Venta CR','Total Venta',
    'SubC TI','SubC CW','Mat TI','Mat CW','Logística','Adicionales','BackOffice',
    'Total Costo','Utilidad','% Margen','Tiene CW'];
  
  const rows = [headers];
  
  (data.sitios || []).forEach(s => {
    // Calcular totales básicos desde actividades (simplificado)
    rows.push([
      s.nombre || '', s.tipo || '', s.fecha || '', 
      (s.ciudad || '').replace('Ciudad_',''),
      s.lc || '', s.cat || '',
      '', '', s.cw_nokia || 0, '', '',
      '', s.cw_costo || 0, 
      s.costos?.matTI || 0, s.costos?.matCW || 0,
      '', '', s.costos?.backoffice || 0,
      '', '', '',
      s.tiene_cw ? 'Sí' : 'No'
    ]);
  });
  
  // Gastos
  let gastoSheet = ss.getSheetByName('Gastos');
  if (!gastoSheet) gastoSheet = ss.insertSheet('Gastos');
  gastoSheet.clearContents();
  gastoSheet.getRange(1, 1, 1, 4).setValues([['Sitio','Tipo','Descripción','Valor']]);
  if (data.gastos && data.gastos.length > 0) {
    const gastRows = data.gastos.map(g => [g.sitio||'', g.tipo||'', g.desc||'', g.valor||0]);
    gastoSheet.getRange(2, 1, gastRows.length, 4).setValues(gastRows);
  }
  
  if (rows.length > 1) {
    sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  }
  
  // Formato header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#144E4A');
  headerRange.setFontColor('#CDFBF2');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);
}
