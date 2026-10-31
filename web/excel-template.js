import * as XLSXParser from './vendor/xlsx.mjs';
if (typeof window !== 'undefined') await import('./vendor/xlsx-style.js');

const XLSX = globalThis.XLSX || XLSXParser;

export const TEMPLATE_HEADERS = ['系列', '型号', '规格', '期初', '入库', '出库', '结存', '备注'];
export const DETAIL_HEADERS = ['单据编号', '业务类型', '系列', '型号', '规格', '数量', '往来单位', '经办人', '时间', '备注'];
const asText = value => value === undefined || value === null ? '' : String(value).trim();
const asNumber = value => {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
};
const col = number => XLSX.utils.encode_col(number);
const cell = (address, value, style) => ({ [address]: { t: typeof value === 'number' ? 'n' : 's', v: value, s: style } });

function periodFromSheet(sheet, fallback) {
  const title = asText(sheet.A1?.v);
  const range = asText(sheet.A2?.v);
  return range || title || fallback;
}

function parseDetailSheet(workbook, products, flowTotals, errors) {
  const sheet = workbook.Sheets['出入库明细'];
  if (!sheet) return null;
  const rows = XLSX.utils.sheet_to_json(sheet, { header:1, defval:'', raw:true });
  const headerIndex = rows.findIndex(row => DETAIL_HEADERS.every((header, index) => asText(row[index]) === header));
  if (headerIndex < 0) { errors.push('“出入库明细”工作表的字段不正确。'); return []; }
  const productIndex = new Map(products.map(product => [`${product.category}\u0000${product.sku}\u0000${product.spec}`, product]));
  const details = [], ids = new Set();
  rows.slice(headerIndex + 1).forEach((row, index) => {
    const rowNumber = headerIndex + index + 2;
    const typeText = asText(row[1]);
    if (!typeText) return;
    const type = ['入库', '采购入库', 'in'].includes(typeText) ? 'in' : ['出库', '销售出库', 'out'].includes(typeText) ? 'out' : '';
    const series = asText(row[2]), sku = asText(row[3]), spec = asText(row[4]), quantity = asNumber(row[5]);
    const product = productIndex.get(`${series}\u0000${sku}\u0000${spec}`);
    const id = asText(row[0]) || `DETAIL-${String(index + 1).padStart(4, '0')}`;
    if (!type || !product || !Number.isFinite(quantity) || quantity <= 0 || ids.has(id)) { errors.push(`明细第 ${rowNumber} 行：单据、业务类型、商品或数量无效。`); return; }
    ids.add(id);
    details.push({ id, type, productId:product.id, productName:product.name, quantity, amount:0, partner:asText(row[6]) || '未填写', operator:asText(row[7]) || 'Excel 导入', createdAt:asText(row[8]) || 'Excel 明细导入', note:asText(row[9]) });
  });
  products.forEach(product => {
    const expected = flowTotals.get(product.id) || { inbound:0, outbound:0 };
    const actual = details.filter(item => item.productId === product.id).reduce((total, item) => ({ inbound:total.inbound + (item.type === 'in' ? item.quantity : 0), outbound:total.outbound + (item.type === 'out' ? item.quantity : 0) }), { inbound:0, outbound:0 });
    if (Math.abs(expected.inbound - actual.inbound) > 0.000001 || Math.abs(expected.outbound - actual.outbound) > 0.000001) errors.push(`“${product.sku}”的出入库明细与月报汇总不一致。`);
  });
  return details;
}

export function parseMonthlyReport(buffer) {
  const workbook = XLSX.read(buffer, { type:'array', cellDates:true });
  const found = workbook.SheetNames.map(name => ({ name, sheet:workbook.Sheets[name] })).find(({ sheet }) => {
    const rows = XLSX.utils.sheet_to_json(sheet, { header:1, defval:'' });
    return rows.some(row => TEMPLATE_HEADERS.every((header, index) => asText(row[index]) === header));
  });
  if (!found) throw new Error('未找到“系列、型号、规格、期初、入库、出库、结存、备注”这 8 个模板字段。');
  const rows = XLSX.utils.sheet_to_json(found.sheet, { header:1, defval:'', raw:true });
  const headerIndex = rows.findIndex(row => TEMPLATE_HEADERS.every((header, index) => asText(row[index]) === header));
  const products = [], summarizedMovements = [], errors = [], seen = new Set(), flowTotals = new Map();
  let series = '';
  rows.slice(headerIndex + 1).forEach((row, index) => {
    const rowNumber = headerIndex + index + 2;
    const seriesValue = asText(row[0]);
    const sku = asText(row[1]);
    if (seriesValue && seriesValue !== '小计' && seriesValue !== '合计') series = seriesValue;
    if (!sku) return;
    const uniqueKey = `${series}\u0000${sku}\u0000${asText(row[2])}`;
    if (seen.has(uniqueKey)) { errors.push(`第 ${rowNumber} 行：同一系列、型号和规格重复。`); return; }
    const opening = asNumber(row[3]), inbound = asNumber(row[4]), outbound = asNumber(row[5]), closing = asNumber(row[6]);
    if ([opening, inbound, outbound, closing].some(Number.isNaN)) { errors.push(`第 ${rowNumber} 行：期初、入库、出库、结存必须是数字。`); return; }
    if (Math.abs(opening + inbound - outbound - closing) > 0.000001) { errors.push(`第 ${rowNumber} 行：期初 + 入库 - 出库 与结存不一致。`); return; }
    seen.add(uniqueKey);
    const productId = `P-EXCEL-${String(index + 1).padStart(4, '0')}`;
    const name = sku;
    products.push({ id:productId, name, sku, category:series || '未分组', spec:asText(row[2]), unit:'件', openingStock:opening, stock:closing, safeStock:0, cost:0, price:0, location:'', remark:asText(row[7]) });
    flowTotals.set(productId, { inbound, outbound });
    const period = periodFromSheet(found.sheet, found.name);
    if (inbound) summarizedMovements.push({ id:`RK-EXCEL-${String(index + 1).padStart(4, '0')}`, type:'in', productId, productName:name, quantity:inbound, amount:0, partner:'Excel 月报导入', operator:'Excel 导入', createdAt:period, note:`模板导入：${period}` });
    if (outbound) summarizedMovements.push({ id:`CK-EXCEL-${String(index + 1).padStart(4, '0')}`, type:'out', productId, productName:name, quantity:outbound, amount:0, partner:'Excel 月报导入', operator:'Excel 导入', createdAt:period, note:`模板导入：${period}` });
  });
  const detailedMovements = parseDetailSheet(workbook, products, flowTotals, errors);
  const movements = detailedMovements === null ? summarizedMovements : detailedMovements;
  if (errors.length) throw new Error(`模板校验未通过：\n${errors.slice(0, 6).join('\n')}${errors.length > 6 ? `\n另有 ${errors.length - 6} 项问题。` : ''}`);
  if (!products.length) throw new Error('模板中没有可导入的商品行。');
  return { state:{ products, suppliers:[], customers:[], movements }, summary:{ sheetName:found.name, productCount:products.length, inboundCount:movements.filter(item => item.type === 'in').length, outboundCount:movements.filter(item => item.type === 'out').length } };
}

function movementsFor(product, movements) {
  return movements.filter(item => item.productId === product.id);
}

export function createMonthlyReport(data, options = {}) {
  const products = [...(data.products || [])].sort((left, right) => `${left.category || ''}\u0000${left.sku || ''}`.localeCompare(`${right.category || ''}\u0000${right.sku || ''}`, 'zh-CN'));
  const movements = data.movements || [];
  const now = options.reportDate ? new Date(options.reportDate) : new Date();
  const year = now.getFullYear(), month = now.getMonth() + 1;
  const ws = {};
  const border = { top:{style:'thin',color:{rgb:'95A5A6'}}, bottom:{style:'thin',color:{rgb:'95A5A6'}}, left:{style:'thin',color:{rgb:'95A5A6'}}, right:{style:'thin',color:{rgb:'95A5A6'}} };
  const titleStyle = { font:{bold:true,sz:16,color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'155A65'}}, alignment:{horizontal:'center',vertical:'center'} };
  const subtitleStyle = { font:{sz:10,color:{rgb:'3E5B63'}}, fill:{fgColor:{rgb:'E9F4F3'}}, alignment:{horizontal:'center',vertical:'center'} };
  const headerStyle = { font:{bold:true,color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'1B6B73'}}, alignment:{horizontal:'center',vertical:'center'}, border };
  const bodyStyle = { alignment:{vertical:'center'}, border };
  const numberStyle = { ...bodyStyle, alignment:{horizontal:'right',vertical:'center'} };
  const noteStyle = { ...bodyStyle, font:{color:{rgb:'52656D'}}, alignment:{vertical:'center',wrapText:true} };
  const subtotalStyle = { font:{bold:true,color:{rgb:'174A53'}}, fill:{fgColor:{rgb:'DDEEEF'}}, alignment:{vertical:'center'}, border };
  const totalStyle = { font:{bold:true,color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'2A6974'}}, alignment:{vertical:'center'}, border:{...border,bottom:{style:'double',color:{rgb:'174A53'}}} };
  Object.assign(ws, cell('A1', `赢之诺${year}年${month}月报表`, titleStyle), cell('A2', `单位：件                            ${year}.${month}.1—${year}.${month}.${new Date(year, month, 0).getDate()}`, subtitleStyle));
  TEMPLATE_HEADERS.forEach((header, index) => Object.assign(ws, cell(`${col(index)}3`, header, headerStyle)));
  ws['!merges'] = [XLSX.utils.decode_range('A1:H1'), XLSX.utils.decode_range('A2:H2')];
  ws['!cols'] = [{wch:12}, {wch:22}, {wch:14}, {wch:10}, {wch:10}, {wch:10}, {wch:10}, {wch:22}];
  ws['!rows'] = [{hpt:30}, {hpt:22}, {hpt:24}];
  for (let titleColumn = 1; titleColumn < TEMPLATE_HEADERS.length; titleColumn += 1) {
    ws[`${col(titleColumn)}1`] = { t:'s', v:'', s:titleStyle };
    ws[`${col(titleColumn)}2`] = { t:'s', v:'', s:subtitleStyle };
  }
  let row = 4;
  const subtotalRows = [];
  const groups = new Map();
  products.forEach(product => { const key = product.category || '未分组'; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(product); });
  for (const [series, items] of groups) {
    const first = row;
    for (const product of items) {
      const rows = movementsFor(product, movements);
      const inbound = rows.filter(item => item.type === 'in').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      const outbound = rows.filter(item => item.type === 'out').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      const closing = Number(product.stock || 0);
      const opening = Number.isFinite(Number(product.openingStock)) && Math.abs(Number(product.openingStock) + inbound - outbound - closing) < 0.000001 ? Number(product.openingStock) : closing - inbound + outbound;
      Object.assign(ws, cell(`A${row}`, row === first ? series : '', bodyStyle), cell(`B${row}`, product.sku || product.name || '', bodyStyle), cell(`C${row}`, product.spec || '', bodyStyle), cell(`D${row}`, opening, numberStyle), cell(`E${row}`, inbound, numberStyle), cell(`F${row}`, outbound, numberStyle), cell(`G${row}`, closing, numberStyle), cell(`H${row}`, product.remark || '', noteStyle));
      ws[`F${row}`] = { t:'n', v:outbound, f:`D${row}+E${row}-G${row}`, s:numberStyle };
      row += 1;
    }
    if (row - first > 1) ws['!merges'].push(XLSX.utils.decode_range(`A${first}:A${row - 1}`));
    const subtotalRow = row;
    subtotalRows.push(subtotalRow);
    Object.assign(ws, cell(`A${row}`, '小计', subtotalStyle), cell(`D${row}`, 0, subtotalStyle), cell(`E${row}`, 0, subtotalStyle), cell(`F${row}`, 0, subtotalStyle), cell(`G${row}`, 0, subtotalStyle));
    ['D','E','F','G'].forEach(letter => { ws[`${letter}${row}`] = { t:'n', f:`SUM(${letter}${first}:${letter}${row - 1})`, s:subtotalStyle }; });
    ws['!merges'].push(XLSX.utils.decode_range(`A${row}:C${row}`));
    row += 1;
  }
  Object.assign(ws, cell(`A${row}`, '合计', totalStyle), cell(`D${row}`, 0, totalStyle), cell(`E${row}`, 0, totalStyle), cell(`F${row}`, 0, totalStyle), cell(`G${row}`, 0, totalStyle));
  ['D','E','F','G'].forEach(letter => { ws[`${letter}${row}`] = { t:'n', f:subtotalRows.length ? subtotalRows.map(item => `${letter}${item}`).join('+') : '0', s:totalStyle }; });
  ws['!merges'].push(XLSX.utils.decode_range(`A${row}:C${row}`));
  Object.assign(ws, cell(`A${row + 1}`, `上期结存：${products.reduce((sum, product) => sum + Number(product.openingStock || 0), 0)}`), cell(`G${row + 1}`, '制表人：WareBoss'), cell(`G${row + 2}`, `日期：${year}.${month}.${new Date(year, month, 0).getDate()}`));
  const noteRow = options.snapshotNote ? row + 3 : row + 2;
  if (options.snapshotNote) Object.assign(ws, cell(`A${noteRow}`, `报表备注：${String(options.snapshotNote).slice(0, 120)}`));
  ws['!ref'] = `A1:H${noteRow}`;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws, `${year}.${month - 1}报表`);
  const productById = new Map(products.map(product => [product.id, product]));
  const detailRows = [['出入库明细'], DETAIL_HEADERS, ...movements.map(item => {
    const product = productById.get(item.productId) || {};
    return [item.id || '', item.type === 'in' ? '入库' : '出库', product.category || '', product.sku || item.productName || '', product.spec || '', Number(item.quantity || 0), item.partner || '', item.operator || '', item.createdAt || '', item.note || ''];
  })];
  const detailSheet = XLSX.utils.aoa_to_sheet(detailRows);
  detailSheet['!cols'] = [{wch:20}, {wch:11}, {wch:12}, {wch:22}, {wch:14}, {wch:10}, {wch:18}, {wch:14}, {wch:20}, {wch:32}];
  detailSheet['!merges'] = [XLSX.utils.decode_range('A1:J1')];
  detailSheet['!rows'] = [{hpt:28}, {hpt:23}];
  for (let detailColumn = 0; detailColumn < DETAIL_HEADERS.length; detailColumn += 1) {
    const title = detailSheet[`${col(detailColumn)}1`] || { t:'s', v:'' };
    title.s = titleStyle;
    detailSheet[`${col(detailColumn)}1`] = title;
    detailSheet[`${col(detailColumn)}2`].s = headerStyle;
  }
  detailSheet['!autofilter'] = { ref:`A2:J${Math.max(2, detailRows.length)}` };
  for (let detailRow = 3; detailRow <= detailRows.length; detailRow += 1) {
    for (let detailColumn = 0; detailColumn < DETAIL_HEADERS.length; detailColumn += 1) {
      const target = detailSheet[`${col(detailColumn)}${detailRow}`];
      if (target) target.s = detailColumn === 5 ? numberStyle : detailColumn === 9 ? noteStyle : bodyStyle;
    }
  }
  XLSX.utils.book_append_sheet(workbook, detailSheet, '出入库明细');
  workbook.Workbook = { CalcPr:{ calcMode:'auto' } };
  return XLSX.write(workbook, { bookType:'xlsx', type:'array', cellStyles:true });
}
