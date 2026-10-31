import { createLocalApi } from './local-store.js';
import { createMonthlyReport, parseMonthlyReport } from './excel-template.js';

const ACCOUNTS = Object.fromEntries(['001', '002', '003', '004', '005'].map(id => [id, { password: '123456', name: `仓库管理员 ${id}` }]));
const SESSION_KEY = 'wareboss-local-account';

function injectStyle() {
  if (document.getElementById('wb-local-shell-style')) return;
  const style = document.createElement('style');
  style.id = 'wb-local-shell-style';
  style.textContent = `
    .wb-gate{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 20% 15%,#196e79 0,transparent 32%),linear-gradient(145deg,#092d37,#061a24);color:#ecfbff}
    .wb-login-card{width:min(100%,380px);padding:34px 30px;border:1px solid rgba(255,255,255,.2);border-radius:22px;background:rgba(7,32,42,.86);box-shadow:0 28px 90px rgba(0,0,0,.42);backdrop-filter:blur(12px)}
    .wb-login-brand{display:flex;align-items:center;gap:11px;margin-bottom:24px;font-size:23px;font-weight:800}.wb-login-brand b{color:#61d6cd}.wb-login-brand span{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#1ba79d;color:white}
    .wb-login-card h1{font-size:22px;margin:0 0 8px}.wb-login-card p{margin:0 0 22px;color:#a8c7ce;line-height:1.65;font-size:14px}.wb-login-card label{display:grid;gap:7px;margin-top:14px;font-size:13px;font-weight:700}.wb-login-card input{box-sizing:border-box;width:100%;border:1px solid #2d6170;border-radius:10px;padding:12px;color:#ecfbff;background:#0a2530;font:inherit;outline:none}.wb-login-card input:focus{border-color:#63d7cf;box-shadow:0 0 0 3px rgba(99,215,207,.15)}.wb-login-card button{width:100%;margin-top:22px;border:0;border-radius:10px;padding:12px;background:#20a69b;color:white;font:700 15px inherit;cursor:pointer}.wb-login-error{min-height:19px;margin:10px 0 -11px;color:#ffaaa2;font-size:13px}.wb-account-chip{display:inline-flex;align-items:center;gap:8px;border:1px solid #d8e7ea;border-radius:9px;padding:7px 9px;background:white;color:#31505a;font-size:12px}.wb-account-chip button{border:0;border-left:1px solid #d8e7ea;background:transparent;color:#49717b;padding-left:8px;cursor:pointer;font:inherit}.wb-logout-menu{color:#bb5a57!important}.wb-clear-overlay{position:fixed;inset:0;z-index:10001;display:grid;place-items:center;padding:24px;background:rgba(2,16,22,.66)}.wb-clear-dialog{width:min(100%,400px);border-radius:18px;background:white;padding:26px;color:#1d3942;box-shadow:0 25px 70px rgba(0,0,0,.3)}.wb-clear-dialog h2{margin:0 0 10px;font-size:20px}.wb-clear-dialog p{line-height:1.65;color:#5d7178}.wb-clear-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px}.wb-clear-actions button{border:0;border-radius:9px;padding:10px 14px;font:700 14px inherit;cursor:pointer}.wb-clear-actions .cancel{background:#eaf0f1;color:#42606a}.wb-clear-actions .confirm{background:#d95252;color:white}@media(max-width:640px){.wb-login-card{padding:28px 22px}.wb-account-chip{display:none}}
    .wb-excel-card{border-color:#c7e2dd!important}.wb-excel-card h3:before{content:'XLSX';display:inline-block;margin-right:7px;border-radius:4px;padding:2px 4px;background:#1d856f;color:#fff;font-size:9px;vertical-align:2px}
    .wb-flow-summary{margin:18px 0;background:#fff;border:1px solid #dbe9eb;border-radius:14px;box-shadow:0 8px 20px rgba(16,58,67,.05);overflow:hidden}.wb-flow-summary h3{margin:0;padding:13px 17px;font-size:14px;color:#294b53;border-bottom:1px solid #e7eff0}.wb-flow-summary table{width:100%;border-collapse:collapse;table-layout:fixed}.wb-flow-summary th{padding:10px;background:#f3f9f8;color:#658087;font-size:12px;font-weight:600;text-align:center}.wb-flow-summary td{padding:14px;color:#193e47;font-size:22px;font-weight:800;text-align:center;border-left:1px solid #e5eeee}.wb-flow-summary td:first-child{border-left:0}.wb-flow-summary td.in{color:#168678}.wb-flow-summary td.out{color:#bf674b}.wb-flow-summary td.stock{color:#24708f}@media(max-width:640px){.wb-flow-summary{margin:12px 0}.wb-flow-summary h3{padding:11px 13px}.wb-flow-summary th{padding:8px;font-size:11px}.wb-flow-summary td{padding:11px 6px;font-size:18px}}
    .wb-report-card{border-color:#d9d6f0!important}.wb-report-list{margin-top:15px;border-top:1px solid #e8e8f2}.wb-report-row{padding:12px 0;border-bottom:1px solid #eef0f3}.wb-report-row:last-child{border-bottom:0}.wb-report-row b{display:block;font-size:13px;color:#324c58}.wb-report-row span{display:block;margin-top:4px;font-size:12px;color:#75868d;line-height:1.45}.wb-report-row button{margin:8px 8px 0 0!important;padding:7px 10px!important;font-size:12px!important}.wb-report-row .remove{border:0;background:transparent;color:#bb5a57;cursor:pointer}.wb-note-cell{max-width:190px;color:#62747a;font-size:12px;line-height:1.45;white-space:normal!important}
    .wb-report-preview{width:min(1080px,100%);max-height:min(86vh,820px);overflow:auto;border-radius:18px;background:#f6f9f9;color:#243d45;box-shadow:0 25px 70px rgba(0,0,0,.35)}.wb-preview-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:18px 22px;background:#155a65;color:white}.wb-preview-head h2{margin:0;font-size:19px}.wb-preview-head p{margin:5px 0 0;color:#cae5e6;font-size:12px}.wb-preview-close{border:0;border-radius:8px;background:#ffffff20;color:white;padding:8px 11px;font-size:18px;cursor:pointer}.wb-preview-body{padding:20px}.wb-preview-note{margin:0 0 15px;padding:10px 12px;border-radius:8px;background:#e8f3f1;color:#48636a;font-size:13px;line-height:1.5}.wb-preview-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}.wb-preview-metrics div{padding:13px;border:1px solid #dbe8e8;border-radius:10px;background:white}.wb-preview-metrics span{display:block;color:#71858b;font-size:12px}.wb-preview-metrics b{display:block;margin-top:5px;font-size:21px;color:#1c5961}.wb-preview-section{margin-top:18px;background:white;border:1px solid #dce9e9;border-radius:11px;overflow:hidden}.wb-preview-section h3{margin:0;padding:13px 15px;font-size:14px;background:#eef7f6}.wb-preview-table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}.wb-preview-table th{padding:10px;background:#1b6b73;color:white;text-align:center}.wb-preview-table td{padding:9px 10px;border-bottom:1px solid #e8eeee;vertical-align:top}.wb-preview-table tr:last-child td{border-bottom:0}.wb-preview-table td.num{text-align:right;font-weight:700}.wb-preview-table td.note{min-width:160px;white-space:normal;color:#5a6f75}.wb-preview-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:17px}.wb-preview-actions button{border:0;border-radius:8px;padding:10px 14px;cursor:pointer;font:600 14px inherit}@media(max-width:640px){.wb-preview-body{padding:13px}.wb-preview-head{padding:15px}.wb-preview-metrics{grid-template-columns:repeat(2,1fr)}.wb-preview-table{font-size:11px}.wb-preview-table th,.wb-preview-table td{padding:8px}.wb-report-preview{max-height:90vh}}
  `;
  document.head.append(style);
}

function showLogin() {
  document.getElementById('wb-login-gate')?.remove();
  const gate = document.createElement('div');
  gate.id = 'wb-login-gate';
  gate.className = 'wb-gate';
  gate.innerHTML = `<form class="wb-login-card"><div class="wb-login-brand"><span>▣</span>Ware<b>Boss</b></div><h1>登录仓库系统</h1><p>本机离线使用。001–005 均可登录，权限相同。</p><label>账号<input name="account" inputmode="numeric" autocomplete="username" placeholder="请输入账号，例如 001" required /></label><label>密码<input name="password" type="password" autocomplete="current-password" placeholder="请输入密码" required /></label><div class="wb-login-error" role="alert"></div><button type="submit">登录系统</button></form>`;
  gate.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const account = String(form.get('account') || '').trim();
    const password = String(form.get('password') || '');
    const error = gate.querySelector('.wb-login-error');
    if (!ACCOUNTS[account] || ACCOUNTS[account].password !== password) {
      error.textContent = '账号或密码不正确，请重试。';
      return;
    }
    localStorage.setItem(SESSION_KEY, account);
    gate.remove();
    installAccountChip();
  });
  document.body.append(gate);
  gate.querySelector('input')?.focus();
}

function installAccountChip() {
  const account = localStorage.getItem(SESSION_KEY);
  const header = document.querySelector('.header-right');
  if (!account || !ACCOUNTS[account] || !header || document.getElementById('wb-account-chip')) return;
  const chip = document.createElement('div');
  chip.id = 'wb-account-chip';
  chip.className = 'wb-account-chip';
  chip.innerHTML = `<span>${account} · ${ACCOUNTS[account].name}</span><button type="button">退出</button>`;
  chip.querySelector('button').addEventListener('click', logout);
  header.prepend(chip);
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  document.getElementById('wb-account-chip')?.remove();
  showLogin();
}

function showClearDialog() {
  if (document.getElementById('wb-clear-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'wb-clear-overlay';
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = `<section class="wb-clear-dialog" role="dialog" aria-modal="true" aria-labelledby="wb-clear-title"><h2 id="wb-clear-title">确认清理全部本机数据？</h2><p>商品、供应商、客户和全部出入库流水都会被删除，无法恢复。已下载到手机或电脑的备份文件不会被删除。</p><div class="wb-clear-actions"><button class="cancel" type="button">取消</button><button class="confirm" type="button">确认清理</button></div></section>`;
  const close = () => overlay.remove();
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  overlay.querySelector('.cancel').addEventListener('click', close);
  overlay.querySelector('.confirm').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = '清理中…';
    try { await createLocalApi().clearState(); location.reload(); } catch (_) { event.currentTarget.disabled = false; event.currentTarget.textContent = '确认清理'; }
  });
  document.body.append(overlay);
}

function downloadExcel() {
  createLocalApi().exportState().then(backup => {
    const bytes = createMonthlyReport(backup.data);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([bytes], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    link.download = `wareboss-${new Date().toISOString().slice(0, 10)}-月度库存报表.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  }).catch(() => window.alert('Excel 导出失败，请稍后重试。'));
}

function downloadReportSnapshot(snapshot) {
  const bytes = createMonthlyReport(snapshot.data, { reportDate:snapshot.createdAt, snapshotNote:snapshot.note });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([bytes], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  link.download = `wareboss-${snapshot.createdAt.slice(0, 10)}-月报快照.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}

const textForHtml = value => String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function reportRows(snapshot) {
  const products = [...(snapshot.data?.products || [])].sort((left, right) => `${left.category || ''}\u0000${left.sku || ''}`.localeCompare(`${right.category || ''}\u0000${right.sku || ''}`, 'zh-CN'));
  const movements = snapshot.data?.movements || [];
  return products.map(product => {
    const items = movements.filter(item => item.productId === product.id);
    const inbound = items.filter(item => item.type === 'in').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const outbound = items.filter(item => item.type === 'out').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const closing = Number(product.stock || 0);
    const opening = Number.isFinite(Number(product.openingStock)) && Math.abs(Number(product.openingStock) + inbound - outbound - closing) < 0.000001 ? Number(product.openingStock) : closing - inbound + outbound;
    return { product, inbound, outbound, opening, closing };
  });
}

function showReportPreview(snapshot) {
  const rows = reportRows(snapshot);
  const movements = snapshot.data?.movements || [];
  const inbound = rows.reduce((sum, row) => sum + row.inbound, 0);
  const outbound = rows.reduce((sum, row) => sum + row.outbound, 0);
  const stock = rows.reduce((sum, row) => sum + row.closing, 0);
  const overlay = document.createElement('div');
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = `<section class="wb-report-preview" role="dialog" aria-modal="true"><header class="wb-preview-head"><div><h2>月报在线查看</h2><p>${new Date(snapshot.createdAt).toLocaleString('zh-CN', { hour12:false })} · 快照编号 ${textForHtml(snapshot.id)}</p></div><button class="wb-preview-close" type="button" aria-label="关闭">×</button></header><div class="wb-preview-body"><p class="wb-preview-note">备注：${textForHtml(snapshot.note || '未填写备注')}</p><div class="wb-preview-metrics"><div><span>商品种类</span><b>${rows.length}</b></div><div><span>入库数量</span><b>${inbound}</b></div><div><span>出库数量</span><b>${outbound}</b></div><div><span>当前结存</span><b>${stock}</b></div></div><div class="wb-preview-section"><h3>月报主表</h3><div class="table-wrap"><table class="wb-preview-table"><thead><tr><th>系列</th><th>型号</th><th>规格</th><th>期初</th><th>入库</th><th>出库</th><th>结存</th><th>备注</th></tr></thead><tbody>${rows.map(({product, opening, inbound:inQty, outbound:outQty, closing}) => `<tr><td>${textForHtml(product.category)}</td><td>${textForHtml(product.sku || product.name)}</td><td>${textForHtml(product.spec)}</td><td class="num">${opening}</td><td class="num">${inQty}</td><td class="num">${outQty}</td><td class="num">${closing}</td><td class="note">${textForHtml(product.remark || '—')}</td></tr>`).join('')}</tbody></table></div></div><div class="wb-preview-section"><h3>出入库明细</h3><div class="table-wrap"><table class="wb-preview-table"><thead><tr><th>时间</th><th>类型</th><th>商品</th><th>数量</th><th>往来单位</th><th>经办人</th><th>备注</th></tr></thead><tbody>${movements.map(item => `<tr><td>${textForHtml(item.createdAt)}</td><td>${item.type === 'in' ? '入库' : '出库'}</td><td>${textForHtml(item.productName)}</td><td class="num">${Number(item.quantity || 0)}</td><td>${textForHtml(item.partner)}</td><td>${textForHtml(item.operator)}</td><td class="note">${textForHtml(item.note || '—')}</td></tr>`).join('') || '<tr><td colspan="7">暂无出入库明细</td></tr>'}</tbody></table></div></div><div class="wb-preview-actions"><button class="secondary close" type="button">关闭</button><button class="primary export" type="button">导出 Excel</button></div></div></section>`;
  const close = () => overlay.remove();
  overlay.querySelector('.wb-preview-close').addEventListener('click', close);
  overlay.querySelector('.close').addEventListener('click', close);
  overlay.querySelector('.export').addEventListener('click', () => downloadReportSnapshot(snapshot));
  document.body.append(overlay);
}

function renderReportSnapshots(card) {
  createLocalApi().listReportSnapshots().then(reports => {
    const list = card.querySelector('.wb-report-list');
    if (!reports.length) { list.innerHTML = '<span>尚未生成月报快照。</span>'; return; }
    list.innerHTML = reports.map(report => `<div class="wb-report-row" data-report-id="${textForHtml(report.id)}"><b>${new Date(report.createdAt).toLocaleString('zh-CN', { hour12:false })} 的月报快照</b><span>${textForHtml(report.note || '未填写备注')} · ${report.data?.products?.length || 0} 个商品</span><button type="button" class="secondary view">在线查看</button><button type="button" class="secondary export">导出 Excel</button><button type="button" class="remove">删除</button></div>`).join('');
    list.querySelectorAll('.wb-report-row').forEach(row => {
      const report = reports.find(item => item.id === row.dataset.reportId);
      row.querySelector('.view').addEventListener('click', () => showReportPreview(report));
      row.querySelector('.export').addEventListener('click', () => downloadReportSnapshot(report));
      row.querySelector('.remove').addEventListener('click', () => showDeleteReportDialog(report, card));
    });
  });
}

function showDeleteReportDialog(report, card) {
  const overlay = document.createElement('div');
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = '<section class="wb-clear-dialog" role="dialog" aria-modal="true"><h2>删除月报快照？</h2><p>删除后将无法从本机导出这份历史快照，已下载的 Excel 文件不会受影响。</p><div class="wb-clear-actions"><button class="cancel" type="button">取消</button><button class="confirm" type="button">确认删除</button></div></section>';
  overlay.querySelector('.cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.confirm').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try { await createLocalApi().deleteReportSnapshot(report.id); overlay.remove(); renderReportSnapshots(card); } catch (_) { event.currentTarget.disabled = false; }
  });
  document.body.append(overlay);
}

function showCreateReportDialog(card) {
  const overlay = document.createElement('div');
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = '<section class="wb-clear-dialog" role="dialog" aria-modal="true"><h2>生成月报快照</h2><p>将冻结当前商品、出入库和结存数据。之后的数据变动不会影响这份月报。</p><label style="display:grid;gap:7px;margin-top:15px;font-weight:600;color:#38545d">备注（可选）<textarea rows="3" maxlength="120" placeholder="例如：10 月盘点后月报" style="resize:vertical;border:1px solid #cbdadd;border-radius:8px;padding:9px;font:inherit"></textarea></label><div class="wb-clear-actions"><button class="cancel" type="button">取消</button><button class="confirm" type="button">确认生成</button></div></section>';
  overlay.querySelector('.cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.confirm').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = '生成中…';
    try { const snapshot = await createLocalApi().createReportSnapshot(overlay.querySelector('textarea').value.trim()); overlay.remove(); if (card) renderReportSnapshots(card); showReportReadyDialog(snapshot); } catch (_) { event.currentTarget.disabled = false; event.currentTarget.textContent = '确认生成'; }
  });
  document.body.append(overlay);
}

function showReportReadyDialog(snapshot) {
  const overlay = document.createElement('div');
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = '<section class="wb-clear-dialog" role="dialog" aria-modal="true"><h2>月报快照已生成</h2><p>当前数据已冻结为一份本机快照。现在可以直接导出 Excel，之后也可在“数据备份”中再次导出。</p><div class="wb-clear-actions"><button class="cancel" type="button">稍后导出</button><button class="confirm" type="button">导出 Excel</button></div></section>';
  overlay.querySelector('.cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.confirm').addEventListener('click', () => { downloadReportSnapshot(snapshot); overlay.remove(); });
  document.body.append(overlay);
}

function installReportSnapshotActions() {
  const grid = document.querySelector('.backup-page .backup-grid');
  if (!grid || document.getElementById('wb-report-card')) return;
  const card = document.createElement('article');
  card.id = 'wb-report-card';
  card.className = 'panel backup-card wb-report-card';
  card.innerHTML = '<h3>月报快照</h3><p>生成后冻结当前库存数据，之后可随时导出 Excel 月报。</p><button class="primary" type="button">生成月报快照</button><div class="wb-report-list"></div>';
  card.querySelector('.primary').addEventListener('click', () => showCreateReportDialog(card));
  grid.prepend(card);
  renderReportSnapshots(card);
}

function showExcelImportDialog(candidate) {
  const overlay = document.createElement('div');
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = `<section class="wb-clear-dialog" role="dialog" aria-modal="true"><h2>确认导入 Excel 月报？</h2><p>已识别工作表“${candidate.summary.sheetName}”：${candidate.summary.productCount} 个商品、${candidate.summary.inboundCount} 条入库汇总、${candidate.summary.outboundCount} 条出库汇总。导入会覆盖本机当前全部业务数据。</p><div class="wb-clear-actions"><button class="cancel" type="button">返回</button><button class="confirm" type="button">确认导入</button></div></section>`;
  const close = () => overlay.remove();
  overlay.querySelector('.cancel').addEventListener('click', close);
  overlay.querySelector('.confirm').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = '导入中…';
    try { await createLocalApi().importState(candidate.state); location.reload(); } catch (_) { event.currentTarget.disabled = false; event.currentTarget.textContent = '确认导入'; }
  });
  document.body.append(overlay);
}

function chooseInitializationFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.remove();
    if (!file) return;
    try { showExcelImportDialog(parseMonthlyReport(await file.arrayBuffer())); } catch (error) { window.alert(error.message || 'Excel 模板解析失败。'); }
  }, { once:true });
  input.click();
}

function showInitializeDialog() {
  const overlay = document.createElement('div');
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = '<section class="wb-clear-dialog" role="dialog" aria-modal="true"><h2>初始化本机数据</h2><p>选择系统兼容的 Excel 月报后，将建立商品、期初、入库、出库和结存数据。文件会先校验，确认导入前不会修改当前数据。</p><div class="wb-clear-actions"><button class="cancel" type="button">取消</button><button class="confirm" type="button">选择 Excel 月报</button></div></section>';
  overlay.querySelector('.cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.confirm').addEventListener('click', () => { overlay.remove(); chooseInitializationFile(); });
  document.body.append(overlay);
}

function installMoreInitialization() {
  const sheet = document.querySelector('.more-sheet');
  if (!sheet || document.getElementById('wb-init-menu')) return;
  const button = document.createElement('button');
  button.id = 'wb-init-menu';
  button.type = 'button';
  button.innerHTML = '<i>⇅</i><span>初始化数据</span><b>›</b>';
  button.addEventListener('click', showInitializeDialog);
  sheet.prepend(button);
}

function installMoreReportGenerator() {
  const sheet = document.querySelector('.more-sheet');
  if (!sheet || document.getElementById('wb-report-menu')) return;
  const button = document.createElement('button');
  button.id = 'wb-report-menu';
  button.type = 'button';
  button.innerHTML = '<i>▤</i><span>生成月报</span><b>›</b>';
  button.addEventListener('click', () => showCreateReportDialog(null));
  sheet.prepend(button);
}

function installMoreLogout() {
  const sheet = document.querySelector('.more-sheet');
  if (!sheet || document.getElementById('wb-logout-menu')) return;
  const button = document.createElement('button');
  button.id = 'wb-logout-menu';
  button.className = 'wb-logout-menu';
  button.type = 'button';
  button.innerHTML = '<i>↪</i><span>退出登录</span><b>›</b>';
  button.addEventListener('click', logout);
  sheet.append(button);
}

function installExcelActions() {
  const grid = document.querySelector('.backup-page .backup-grid');
  if (!grid || document.getElementById('wb-excel-card')) return;
  const card = document.createElement('article');
  card.id = 'wb-excel-card';
  card.className = 'panel backup-card wb-excel-card';
  card.innerHTML = `<h3>Excel 月报模板</h3><p>使用“系列、型号、规格、期初、入库、出库、结存、备注”模板导入或导出。</p><input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden/><button class="primary" type="button">导出 Excel 月报</button><button class="secondary import-button" type="button">导入 Excel 月报</button>`;
  const [fileInput, exportButton, importButton] = card.querySelectorAll('input,button');
  exportButton.addEventListener('click', downloadExcel);
  importButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    try { showExcelImportDialog(parseMonthlyReport(await file.arrayBuffer())); } catch (error) { window.alert(error.message || 'Excel 模板解析失败。'); }
  });
  grid.prepend(card);
}

let latestFlowKey = '';
let loadingFlowStats = false;
function installHomeFlowStats() {
  const dashboard = document.querySelector('.dashboard');
  const welcome = dashboard?.querySelector('.welcome');
  if (!dashboard || !welcome) return;
  let card = document.getElementById('wb-flow-summary');
  if (!card) {
    card = document.createElement('section');
    card.id = 'wb-flow-summary';
    card.className = 'wb-flow-summary';
    card.innerHTML = '<h3>库存汇总</h3><table><thead><tr><th>入库</th><th>出库</th><th>结存</th></tr></thead><tbody><tr><td class="in">0</td><td class="out">0</td><td class="stock">0</td></tr></tbody></table>';
    welcome.insertAdjacentElement('afterend', card);
  }
  if (loadingFlowStats) return;
  loadingFlowStats = true;
  createLocalApi().exportState().then(backup => {
    const data = backup.data;
    const inbound = data.movements.filter(item => item.type === 'in').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const outbound = data.movements.filter(item => item.type === 'out').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const stock = data.products.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const key = `${inbound}/${outbound}/${stock}`;
    if (key !== latestFlowKey) {
      latestFlowKey = key;
      const cells = card.querySelectorAll('tbody td');
      cells[0].textContent = inbound;
      cells[1].textContent = outbound;
      cells[2].textContent = stock;
    }
  }).finally(() => { loadingFlowStats = false; });
}

let loadingProductRemarks = false;
function installProductRemarks() {
  const table = document.querySelector('.table-panel table');
  if (!table || table.querySelector('thead th')?.textContent.trim() !== '商品信息' || loadingProductRemarks) return;
  const headerRow = table.querySelector('thead tr');
  if (!headerRow.querySelector('.wb-remark-heading')) {
    const header = document.createElement('th');
    header.className = 'wb-remark-heading';
    header.textContent = '备注';
    headerRow.append(header);
  }
  loadingProductRemarks = true;
  createLocalApi()('/products').then(products => {
    table.querySelectorAll('tbody tr').forEach(row => {
      if (row.querySelector('.wb-note-cell')) return;
      const cells = row.querySelectorAll('td');
      const name = cells[0]?.querySelector('b')?.textContent.trim();
      const sku = cells[0]?.querySelector('small')?.textContent.trim();
      const category = cells[1]?.textContent.trim();
      const product = products.find(item => item.name === name && item.sku === sku && item.category === category);
      const note = document.createElement('td');
      note.className = 'wb-note-cell';
      note.textContent = product?.remark || '—';
      row.append(note);
    });
  }).finally(() => { loadingProductRemarks = false; });
}

function enableAutomaticUpdates() {
  if (!('serviceWorker' in navigator)) return;
  let updateReady = false;
  let reloaded = false;
  const reloadWhenSafe = () => {
    if (!updateReady || reloaded || document.querySelector('.modal,.overlay,.wb-gate')) return;
    reloaded = true;
    location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => { updateReady = true; reloadWhenSafe(); });
  navigator.serviceWorker.register('./sw.js', { updateViaCache:'none' })
    .then(registration => {
      registration.update();
      setInterval(() => registration.update(), 15 * 60 * 1000);
    })
    .catch(() => {});
  document.addEventListener('click', () => setTimeout(reloadWhenSafe, 0));
}

function installPageActions() {
  const importButton = document.querySelector('.backup-page .import-button');
  const backupInput = document.querySelector('.backup-page input[type="file"]');
  if (importButton && backupInput && !importButton.dataset.localBound) {
    importButton.dataset.localBound = 'true';
    importButton.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); backupInput.click(); }, true);
  }
  const clearButton = document.querySelector('.backup-page .danger-card .danger-button');
  if (clearButton && !clearButton.dataset.localBound) {
    clearButton.dataset.localBound = 'true';
    clearButton.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); showClearDialog(); }, true);
  }
  installExcelActions();
  installReportSnapshotActions();
  installHomeFlowStats();
  installProductRemarks();
  installMoreInitialization();
  installMoreReportGenerator();
  installMoreLogout();
}

export function installLocalShell() {
  injectStyle();
  enableAutomaticUpdates();
  const refresh = () => { installAccountChip(); installPageActions(); };
  new MutationObserver(refresh).observe(document.body, { childList:true, subtree:true });
  if (ACCOUNTS[localStorage.getItem(SESSION_KEY)]) setTimeout(refresh, 0); else showLogin();
}
