import { createLocalApi } from './local-store.js?v=20261031.6';
import { createMonthlyReport, parseMonthlyReport } from './excel-template.js?v=20261031.6';

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
    .wb-quick-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:18px 0}.wb-quick-action{display:flex;align-items:center;gap:12px;padding:16px;border:1px solid #dceaea;border-radius:13px;background:#fff;color:#254951;cursor:pointer;text-align:left;box-shadow:0 7px 18px rgba(16,58,67,.04)}.wb-quick-action i{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:#e5f5f0;color:#117d70;font-size:21px;font-style:normal}.wb-quick-action.out i{background:#f1edff;color:#735cc0}.wb-quick-action b{display:block;font-size:15px}.wb-quick-action span{display:block;margin-top:3px;color:#71848a;font-size:12px}.wb-batch-dialog{width:min(100%,650px);max-height:90vh;overflow:auto}.wb-batch-dialog label{display:grid;gap:6px;margin-top:13px;color:#38545d;font-size:13px;font-weight:700}.wb-batch-dialog input,.wb-batch-dialog select{width:100%;border:1px solid #cbdadd;border-radius:8px;padding:9px;background:white;color:#203d46;font:inherit}.wb-batch-items{margin-top:17px}.wb-batch-items h3{margin:0 0 8px;font-size:14px}.wb-batch-row{display:grid;grid-template-columns:minmax(0,1.5fr) 78px minmax(0,1fr) 36px;gap:8px;margin-top:8px;align-items:center}.wb-batch-row .remove{border:0;background:#fff0ef;color:#b95a56;border-radius:7px;height:36px;font-size:18px;cursor:pointer}.wb-add-line{margin-top:10px;border:1px dashed #82b9b1;background:#f3fbf9;color:#167869;border-radius:8px;padding:9px 11px;font-weight:700;cursor:pointer}.wb-batch-note{font-size:12px!important;font-weight:500!important;color:#6f8388!important}@media(max-width:640px){.wb-quick-actions{margin:12px 0;gap:9px}.wb-quick-action{padding:13px 11px;gap:9px}.wb-quick-action i{width:33px;height:33px;font-size:18px}.wb-quick-action b{font-size:13px}.wb-quick-action span{font-size:11px}.wb-batch-row{grid-template-columns:minmax(0,1fr) 66px 34px}.wb-batch-row input.note{display:none}}
    .wb-customer-filter{max-width:190px;border:1px solid #cbdadd;border-radius:7px;padding:6px 9px;background:#fff;color:#38545d;font:600 12px inherit}@media(max-width:640px){.wb-customer-filter{max-width:138px;font-size:11px}}
    .wb-dashboard-scope{display:grid;gap:3px;color:#d9f4ef;font-size:11px;font-weight:700}.wb-dashboard-scope .wb-customer-filter{min-width:145px;max-width:190px}.wb-customer-stats{grid-column:1/-1}.wb-customer-stat-row{display:grid;grid-template-columns:minmax(0,1fr) 62px 62px 62px auto;align-items:center;gap:8px;padding:12px 0;border-top:1px solid #edf2f2}.wb-customer-stat-row:first-of-type{border-top:0}.wb-customer-stat-row b{font-size:14px}.wb-customer-stat-row span{font-size:12px;color:#667b81;text-align:center}.wb-customer-stat-row button{border:1px solid #b9ddd6;border-radius:7px;background:#eff9f6;color:#13796b;padding:6px 8px;font:700 12px inherit;cursor:pointer}.wb-movement-customer{display:block!important;color:#16786b!important;font-weight:700}@media(max-width:640px){.wb-dashboard-scope .wb-customer-filter{min-width:125px}.wb-customer-stat-row{grid-template-columns:minmax(0,1fr) 47px 47px 47px auto;gap:4px}.wb-customer-stat-row span{font-size:10px}.wb-customer-stat-row button{padding:5px;font-size:11px}}
    .wb-home-customers{margin:18px 0;padding:16px}.wb-home-customers h3{margin:0 0 8px;font-size:15px}.wb-home-customer{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:12px 0;border-top:1px solid #edf2f2}.wb-home-customer:first-of-type{border-top:0}.wb-home-customer b{display:block;font-size:14px}.wb-home-customer span{display:block;margin-top:4px;font-size:12px;color:#6c8187}.wb-home-customer button{margin-left:6px;border:0;border-radius:7px;padding:7px 8px;background:#eaf7f4;color:#137a6c;font:700 12px inherit;cursor:pointer}.wb-home-customer button.flow{background:#f1eeff;color:#6e5ac0}@media(max-width:640px){.wb-home-customers{margin:12px 0;padding:13px}.wb-home-customer{padding:10px 0}.wb-home-customer button{padding:6px}}
    .wb-report-card{border-color:#d9d6f0!important}.wb-report-list{margin-top:15px;border-top:1px solid #e8e8f2}.wb-report-row{padding:12px 0;border-bottom:1px solid #eef0f3}.wb-report-row:last-child{border-bottom:0}.wb-report-row b{display:block;font-size:13px;color:#324c58}.wb-report-row span{display:block;margin-top:4px;font-size:12px;color:#75868d;line-height:1.45}.wb-report-row button{margin:8px 8px 0 0!important;padding:7px 10px!important;font-size:12px!important}.wb-report-row .remove{border:0;background:transparent;color:#bb5a57;cursor:pointer}.wb-note-cell{max-width:190px;color:#62747a;font-size:12px;line-height:1.45;white-space:normal!important}
    .wb-report-preview{width:min(1080px,100%);max-height:min(86vh,820px);overflow:auto;border-radius:18px;background:#f6f9f9;color:#243d45;box-shadow:0 25px 70px rgba(0,0,0,.35)}.wb-preview-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:18px 22px;background:#155a65;color:white}.wb-preview-head h2{margin:0;font-size:19px}.wb-preview-head p{margin:5px 0 0;color:#cae5e6;font-size:12px}.wb-preview-close{border:0;border-radius:8px;background:#ffffff20;color:white;padding:8px 11px;font-size:18px;cursor:pointer}.wb-preview-body{padding:20px}.wb-preview-note{margin:0 0 15px;padding:10px 12px;border-radius:8px;background:#e8f3f1;color:#48636a;font-size:13px;line-height:1.5}.wb-preview-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}.wb-preview-metrics div{padding:13px;border:1px solid #dbe8e8;border-radius:10px;background:white}.wb-preview-metrics span{display:block;color:#71858b;font-size:12px}.wb-preview-metrics b{display:block;margin-top:5px;font-size:21px;color:#1c5961}.wb-preview-section{margin-top:18px;background:white;border:1px solid #dce9e9;border-radius:11px;overflow:hidden}.wb-preview-section h3{margin:0;padding:13px 15px;font-size:14px;background:#eef7f6}.wb-preview-table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}.wb-preview-table th{padding:10px;background:#1b6b73;color:white;text-align:center}.wb-preview-table td{padding:9px 10px;border-bottom:1px solid #e8eeee;vertical-align:top}.wb-preview-table tr:last-child td{border-bottom:0}.wb-preview-table td.num{text-align:right;font-weight:700}.wb-preview-table td.note{min-width:160px;white-space:normal;color:#5a6f75}.wb-preview-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:17px}.wb-preview-actions button{border:0;border-radius:8px;padding:10px 14px;cursor:pointer;font:600 14px inherit}@media(max-width:640px){.wb-preview-body{padding:13px}.wb-preview-head{padding:15px}.wb-preview-metrics{grid-template-columns:repeat(2,1fr)}.wb-preview-table{font-size:11px}.wb-preview-table th,.wb-preview-table td{padding:8px}.wb-report-preview{max-height:90vh}}
    .dashboard>.grid{display:none!important}.wb-more-functions{grid-column:1/-1;padding:8px!important}.wb-more-functions h3{margin:8px 8px 12px;font-size:16px;color:#254b54}.wb-more-function{display:flex;align-items:center;width:100%;gap:12px;padding:14px 11px;border:0;border-top:1px solid #edf2f2;background:transparent;color:#23464e;font:inherit;text-align:left;cursor:pointer}.wb-more-function:first-of-type{border-top:0}.wb-more-function i{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#e5f5f0;color:#147d70;font-size:18px;font-style:normal}.wb-more-function span{flex:1}.wb-more-function b{display:block;font-size:14px}.wb-more-function small{display:block;margin-top:3px;color:#71848a;font-size:12px}.wb-more-function em{color:#8da1a6;font-size:20px;font-style:normal}.wb-alert-card{grid-column:1/-1}.wb-alert-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:12px;border-bottom:1px solid #eaf0f0}.wb-alert-head h3{margin:0;font-size:16px;color:#244851}.wb-alert-list{margin-top:2px}.wb-alert-item{display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:10px;padding:13px 0;border-bottom:1px solid #edf2f2}.wb-alert-item:last-child{border-bottom:0}.wb-alert-item i{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#fff1ed;color:#d26b4f;font-style:normal}.wb-alert-item b{display:block;font-size:14px;color:#294b53}.wb-alert-item span{display:block;margin-top:3px;color:#71848a;font-size:12px}.wb-alert-item strong{color:#bf674b;font-size:13px;text-align:right}.wb-alert-item strong small{display:block;margin-top:3px;color:#89999d;font-size:11px;font-weight:500}@media(max-width:640px){.wb-more-functions{padding:5px!important}.wb-more-function{padding:13px 8px}.wb-alert-head{align-items:flex-start}.wb-alert-head .wb-customer-filter{max-width:150px}.wb-alert-item{grid-template-columns:32px minmax(0,1fr) auto;gap:8px}.wb-alert-item i{width:30px;height:30px}.wb-alert-item b{font-size:13px}.wb-alert-item span{font-size:11px}}
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

async function showClearDialog() {
  if (document.getElementById('wb-clear-overlay')) return;
  const partners = await createLocalApi()('/partners');
  const overlay = document.createElement('div');
  overlay.id = 'wb-clear-overlay';
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = `<section class="wb-clear-dialog" role="dialog" aria-modal="true" aria-labelledby="wb-clear-title"><h2 id="wb-clear-title">确认清理本机数据？</h2><p>可选择只清理某个客户，或清理全部数据。已下载的备份和 Excel 文件不会受影响。</p><label style="display:grid;gap:7px;margin-top:15px;font-weight:600;color:#38545d">清理范围<select class="customer" style="border:1px solid #cbdadd;border-radius:8px;padding:9px;font:inherit"><option value="">全部本机数据</option>${partners.customers.map(item => `<option value="${textForHtml(item.id)}">仅清理：${textForHtml(item.name)}</option>`).join('')}</select></label><div class="wb-clear-actions"><button class="cancel" type="button">取消</button><button class="confirm" type="button">确认清理</button></div></section>`;
  const close = () => overlay.remove();
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  overlay.querySelector('.cancel').addEventListener('click', close);
  overlay.querySelector('.confirm').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = '清理中…';
    try { const customerId = overlay.querySelector('.customer').value; if (customerId) await createLocalApi().clearCustomerData(customerId); else await createLocalApi().clearState(); location.reload(); } catch (error) { window.alert(error.message || '清理失败，请重试。'); event.currentTarget.disabled = false; event.currentTarget.textContent = '确认清理'; }
  });
  document.body.append(overlay);
}

function downloadExcel(customerId = '') {
  createLocalApi().exportState().then(backup => {
    const customer = backup.data.customers.find(item => item.id === customerId);
    const data = customer ? { ...backup.data, customers:[customer], products:backup.data.products.filter(item => item.customerId === customer.id), movements:backup.data.movements.filter(item => item.customerId === customer.id) } : backup.data;
    if (customer && !data.products.length) throw new Error('该客户暂无库存数据可导出');
    const bytes = createMonthlyReport(data, { snapshotNote:customer ? `客户：${customer.name}` : '' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([bytes], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    link.download = `wareboss-${customer ? `${customer.name}-` : ''}${new Date().toISOString().slice(0, 10)}-月度库存报表.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  }).catch(() => window.alert('Excel 导出失败，请稍后重试。'));
}

async function showCustomerExportDialog() {
  const partners = await createLocalApi()('/partners');
  const overlay = document.createElement('div');
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = `<section class="wb-clear-dialog" role="dialog" aria-modal="true"><h2>导出客户月报</h2><p>请选择需要导出的客户。Excel 仅包含该客户的库存和出入库明细。</p><select class="customer" style="width:100%;margin-top:12px;border:1px solid #cbdadd;border-radius:8px;padding:9px;font:inherit"><option value="">请选择客户</option>${partners.customers.map(item => `<option value="${textForHtml(item.id)}">${textForHtml(item.name)}</option>`).join('')}</select><label style="display:grid;gap:7px;margin-top:12px;font-weight:600;color:#38545d">没有客户？直接填写客户名称<input class="customer-name" placeholder="旧数据会归属到此客户" style="border:1px solid #cbdadd;border-radius:8px;padding:9px;font:inherit"/></label><div class="wb-clear-actions"><button class="cancel" type="button">取消</button><button class="confirm" type="button">导出 Excel</button></div></section>`;
  overlay.querySelector('.cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.confirm').addEventListener('click', async () => { let customerId = overlay.querySelector('.customer').value; const name = overlay.querySelector('.customer-name').value.trim(); try { if (name) { const customer = await createLocalApi()('/partners', { method:'POST', body:JSON.stringify({ type:'customer', name }) }); await createLocalApi().assignUnassignedCustomer(customer.id); customerId = customer.id; } if (!customerId) throw new Error('请选择或填写客户。'); downloadExcel(customerId); overlay.remove(); } catch (error) { window.alert(error.message || '无法导出月报。'); } });
  document.body.append(overlay);
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

async function showCreateReportDialog(card) {
  const [partners, backup] = await Promise.all([createLocalApi()('/partners'), createLocalApi().exportState()]);
  const overlay = document.createElement('div');
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = `<section class="wb-clear-dialog" role="dialog" aria-modal="true"><h2>生成客户月报快照</h2><p>选择客户后，将冻结该客户当前的商品、出入库和结存数据。</p><label style="display:grid;gap:7px;margin-top:15px;font-weight:600;color:#38545d">客户<select class="customer" style="border:1px solid #cbdadd;border-radius:8px;padding:9px;font:inherit"><option value="">请选择客户</option>${partners.customers.map(item => `<option value="${textForHtml(item.id)}">${textForHtml(item.name)}</option>`).join('')}</select></label><label style="display:grid;gap:7px;margin-top:15px;font-weight:600;color:#38545d">备注（可选）<textarea rows="3" maxlength="120" placeholder="例如：10 月盘点后月报" style="resize:vertical;border:1px solid #cbdadd;border-radius:8px;padding:9px;font:inherit"></textarea></label><div class="wb-clear-actions"><button class="cancel" type="button">取消</button><button class="confirm" type="button">确认生成</button></div></section>`;
  const customerNameField = document.createElement('label');
  customerNameField.style.cssText = 'display:grid;gap:7px;margin-top:12px;font-weight:600;color:#38545d';
  customerNameField.innerHTML = '没有客户？直接填写客户名称<input class="customer-name" placeholder="旧数据会归属到此客户" style="border:1px solid #cbdadd;border-radius:8px;padding:9px;font:inherit"/>';
  overlay.querySelector('.customer').closest('label').after(customerNameField);
  overlay.querySelector('.cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.confirm').addEventListener('click', async event => {
    const customerName = overlay.querySelector('.customer-name').value.trim();
    if (!customerName) return;
    event.stopImmediatePropagation();
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = '生成中…';
    try {
      const api = createLocalApi();
      const customer = await api('/partners', { method:'POST', body:JSON.stringify({ type:'customer', name:customerName }) });
      await api.assignUnassignedCustomer(customer.id);
      const current = await api.exportState();
      const data = current.data, reportData = { ...data, customers:[customer], products:data.products.filter(item => item.customerId === customer.id), movements:data.movements.filter(item => item.customerId === customer.id) };
      if (!reportData.products.length) throw new Error('该客户暂无库存数据，无法生成月报');
      const note = overlay.querySelector('textarea').value.trim();
      const snapshot = await api.createReportSnapshot(`客户：${customer.name}${note ? `；${note}` : ''}`, reportData);
      overlay.remove(); if (card) renderReportSnapshots(card); showReportReadyDialog(snapshot);
    } catch (error) { window.alert(error.message || '生成失败，请重试。'); event.currentTarget.disabled = false; event.currentTarget.textContent = '确认生成'; }
  }, true);
  overlay.querySelector('.confirm').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = '生成中…';
    try { const customer = partners.customers.find(item => item.id === overlay.querySelector('.customer').value); if (!customer) throw new Error('请选择客户'); const data = backup.data; const reportData = { ...data, customers:[customer], products:data.products.filter(item => item.customerId === customer.id), movements:data.movements.filter(item => item.customerId === customer.id) }; if (!reportData.products.length) throw new Error('该客户暂无库存数据，无法生成月报'); const note = overlay.querySelector('textarea').value.trim(); const snapshot = await createLocalApi().createReportSnapshot(`客户：${customer.name}${note ? `；${note}` : ''}`, reportData); overlay.remove(); if (card) renderReportSnapshots(card); showReportReadyDialog(snapshot); } catch (error) { window.alert(error.message || '生成失败，请重试。'); event.currentTarget.disabled = false; event.currentTarget.textContent = '确认生成'; }
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

function assignCustomerOwnership(state, customer) {
  const data = JSON.parse(JSON.stringify(state));
  data.customers = [customer];
  data.products = data.products.map(product => ({ ...product, customerId:customer.id, customerName:customer.name }));
  data.movements = data.movements.map(item => ({ ...item, customerId:customer.id, customerName:customer.name }));
  return data;
}

async function showExcelImportDialog(candidate) {
  const partnerState = await createLocalApi()('/partners');
  const options = partnerState.customers.map(customer => `<option value="${textForHtml(customer.id)}">${textForHtml(customer.name)}</option>`).join('');
  const overlay = document.createElement('div');
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = `<section class="wb-clear-dialog" role="dialog" aria-modal="true"><h2>确认导入 Excel 月报？</h2><p>已识别工作表“${candidate.summary.sheetName}”：${candidate.summary.productCount} 个商品、${candidate.summary.inboundCount} 条入库汇总、${candidate.summary.outboundCount} 条出库汇总。导入后，这批库存将全部归属到所选客户。</p><label style="display:grid;gap:7px;margin-top:15px;font-weight:600;color:#38545d">库存归属客户<select class="wb-import-customer" style="border:1px solid #cbdadd;border-radius:8px;padding:9px;font:inherit"><option value="">${options ? '请选择已有客户' : '暂无客户，请填写新客户'}</option>${options}</select></label><label style="display:grid;gap:7px;margin-top:12px;font-weight:600;color:#38545d">或新建客户<input class="wb-import-customer-name" placeholder="填写客户名称后将自动创建" style="border:1px solid #cbdadd;border-radius:8px;padding:9px;font:inherit"/></label><div class="wb-clear-actions"><button class="cancel" type="button">返回</button><button class="confirm" type="button">确认导入</button></div></section>`;
  const close = () => overlay.remove();
  overlay.querySelector('.cancel').addEventListener('click', close);
  overlay.querySelector('.confirm').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = '导入中…';
    const customerId = overlay.querySelector('.wb-import-customer').value;
    const customerName = overlay.querySelector('.wb-import-customer-name').value.trim();
    try {
      let customer = partnerState.customers.find(item => item.id === customerId);
      if (customerName) customer = await createLocalApi()('/partners', { method:'POST', body:JSON.stringify({ type:'customer', name:customerName }) });
      if (!customer) throw new Error('请先选择或填写库存归属客户');
      await createLocalApi().importState(assignCustomerOwnership(candidate.state, customer));
      location.reload();
    } catch (error) { window.alert(error.message || '导入失败，请重试。'); event.currentTarget.disabled = false; event.currentTarget.textContent = '确认导入'; }
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
    try { await showExcelImportDialog(parseMonthlyReport(await file.arrayBuffer())); } catch (error) { window.alert(error.message || 'Excel 模板解析失败。'); }
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
  exportButton.addEventListener('click', () => showCustomerExportDialog().catch(error => window.alert(error.message || '无法打开客户列表。')));
  importButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    try { await showExcelImportDialog(parseMonthlyReport(await file.arrayBuffer())); } catch (error) { window.alert(error.message || 'Excel 模板解析失败。'); }
  });
  grid.prepend(card);
}

let latestFlowKey = '';
let loadingFlowStats = false;
let dashboardCustomerId = '';
let loadingDashboardCustomerScope = false;
function installDashboardCustomerScope() {
  const dashboard = document.querySelector('.dashboard');
  const welcome = dashboard?.querySelector('.welcome');
  if (!dashboard || !welcome || document.getElementById('wb-dashboard-customer') || loadingDashboardCustomerScope) return;
  loadingDashboardCustomerScope = true;
  createLocalApi()('/partners').then(partners => {
    if (!partners.customers.length) return;
    const scope = document.createElement('label');
    scope.className = 'wb-dashboard-scope';
    scope.textContent = '统计范围';
    const select = document.createElement('select');
    select.id = 'wb-dashboard-customer';
    select.className = 'wb-customer-filter';
    select.innerHTML = `<option value="">全部客户汇总</option>${partners.customers.map(customer => `<option value="${textForHtml(customer.id)}">${textForHtml(customer.name)}</option>`).join('')}`;
    select.value = dashboardCustomerId;
    select.addEventListener('change', () => { dashboardCustomerId = select.value; latestFlowKey = ''; installHomeFlowStats(); refreshDashboardCustomerStats(dashboard); });
    scope.append(select);
    welcome.querySelector('.welcome-action')?.prepend(scope);
    refreshDashboardCustomerStats(dashboard);
  }).finally(() => { loadingDashboardCustomerScope = false; });
}
function refreshDashboardCustomerStats(dashboard) {
  createLocalApi().exportState().then(backup => {
    const data = backup.data, products = data.products.filter(item => !dashboardCustomerId || item.customerId === dashboardCustomerId), movements = data.movements.filter(item => !dashboardCustomerId || item.customerId === dashboardCustomerId);
    const stats = dashboard.querySelectorAll('.stats article strong');
    if (stats.length >= 4) { stats[0].textContent = products.length; stats[1].textContent = products.reduce((sum, item) => sum + Number(item.stock || 0), 0); stats[2].textContent = `¥${movements.filter(item => item.type === 'in').reduce((sum, item) => sum + Number(item.amount || 0), 0)}`; stats[3].textContent = `¥${movements.filter(item => item.type === 'out').reduce((sum, item) => sum + Number(item.amount || 0), 0)}`; }
  });
}
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
    const movements = data.movements.filter(item => !dashboardCustomerId || item.customerId === dashboardCustomerId);
    const products = data.products.filter(item => !dashboardCustomerId || item.customerId === dashboardCustomerId);
    const inbound = movements.filter(item => item.type === 'in').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const outbound = movements.filter(item => item.type === 'out').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const stock = products.reduce((sum, item) => sum + Number(item.stock || 0), 0);
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

function showBatchConfirm(summary, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = `<section class="wb-clear-dialog" role="dialog" aria-modal="true"><h2>确认提交${summary.type === 'in' ? '入库' : '出库'}单？</h2><p>${textForHtml(summary.customerName)}：共 ${summary.items.length} 件商品，${summary.items.reduce((sum, item) => sum + item.quantity, 0)} 件。确认后将立即更新库存并生成流水。</p><div class="wb-clear-actions"><button class="cancel" type="button">返回修改</button><button class="confirm" type="button">确认提交</button></div></section>`;
  overlay.querySelector('.cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.confirm').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = '提交中…';
    try { await onConfirm(); overlay.remove(); location.reload(); } catch (error) { window.alert(error.message || '保存失败，请重试。'); event.currentTarget.disabled = false; event.currentTarget.textContent = '确认提交'; }
  });
  document.body.append(overlay);
}

async function showBatchMovementDialog(type) {
  const api = createLocalApi();
  const [partnerData, products] = await Promise.all([api('/partners'), api('/products')]);
  if (!partnerData.customers.length) { window.alert('请先在“往来单位”中新建客户，再进行出入库。'); return; }
  const overlay = document.createElement('div');
  overlay.className = 'wb-clear-overlay';
  overlay.innerHTML = `<form class="wb-clear-dialog wb-batch-dialog" role="dialog" aria-modal="true"><h2>${type === 'in' ? '采购入库' : '销售出库'}（支持多商品）</h2><p>先选择库存归属客户，再逐行添加该客户名下的商品。</p><label>库存归属客户<select class="customer"><option value="">请选择客户</option>${partnerData.customers.map(customer => `<option value="${textForHtml(customer.id)}">${textForHtml(customer.name)}</option>`).join('')}</select></label>${type === 'in' ? '<label>供应商（可选）<input class="partner" placeholder="例如：华东包装材料"/></label>' : '<label>往来说明（可选）<input class="partner" placeholder="例如：客户自提"/></label>'}<section class="wb-batch-items"><h3>商品明细</h3><div class="rows"></div><button class="wb-add-line" type="button">＋ 添加商品</button></section><label>经办人<input class="operator" value="管理员"/></label><label>单据备注（可选）<input class="note" placeholder="整单备注"/></label><div class="wb-clear-actions"><button class="cancel" type="button">取消</button><button class="confirm" type="submit">下一步：核对并确认</button></div></form>`;
  const form = overlay.querySelector('form');
  const customer = form.querySelector('.customer');
  const rows = form.querySelector('.rows');
  const productOptions = () => products.filter(product => product.customerId === customer.value).map(product => `<option value="${textForHtml(product.id)}">${textForHtml(product.name)}（库存 ${Number(product.stock || 0)}${textForHtml(product.unit || '件')}）</option>`).join('');
  const addRow = () => {
    const row = document.createElement('div');
    row.className = 'wb-batch-row';
    row.innerHTML = `<select class="product" required><option value="">${customer.value ? '请选择商品' : '请先选择客户'}</option>${productOptions()}</select><input class="quantity" type="number" min="1" value="1" required/><input class="note" placeholder="本行备注（可选）"/><button class="remove" type="button" aria-label="删除本行">×</button>`;
    row.querySelector('.remove').addEventListener('click', () => { if (rows.children.length > 1) row.remove(); });
    rows.append(row);
  };
  customer.addEventListener('change', () => { rows.innerHTML = ''; addRow(); });
  form.querySelector('.wb-add-line').addEventListener('click', addRow);
  form.querySelector('.cancel').addEventListener('click', () => overlay.remove());
  form.addEventListener('submit', event => {
    event.preventDefault();
    const selectedCustomer = partnerData.customers.find(item => item.id === customer.value);
    const items = [...rows.querySelectorAll('.wb-batch-row')].map(row => ({ productId:row.querySelector('.product').value, quantity:Number(row.querySelector('.quantity').value), note:row.querySelector('.note').value.trim() }));
    if (!selectedCustomer) { window.alert('请选择库存归属客户。'); return; }
    if (items.some(item => !item.productId || !Number.isFinite(item.quantity) || item.quantity <= 0)) { window.alert('请完整填写每一行的商品和数量。'); return; }
    showBatchConfirm({ type, customerName:selectedCustomer.name, items }, () => api('/movements/batch', { method:'POST', body:JSON.stringify({ type, customerId:selectedCustomer.id, partner:form.querySelector('.partner').value.trim(), operator:form.querySelector('.operator').value.trim(), note:form.querySelector('label > .note').value.trim(), items }) }));
  });
  document.body.append(overlay);
  addRow();
}

function installDashboardQuickActions() {
  const dashboard = document.querySelector('.dashboard');
  const welcome = dashboard?.querySelector('.welcome');
  if (!dashboard || !welcome || document.getElementById('wb-quick-actions')) return;
  const card = document.createElement('section');
  card.id = 'wb-quick-actions';
  card.className = 'wb-quick-actions';
  card.innerHTML = '<button type="button" class="wb-quick-action in"><i>↓</i><span><b>采购入库</b>选择客户后批量入库</span></button><button type="button" class="wb-quick-action out"><i>↑</i><span><b>销售出库</b>选择客户后批量出库</span></button>';
  card.querySelector('.in').addEventListener('click', () => showBatchMovementDialog('in').catch(error => window.alert(error.message || '无法打开入库单。')));
  card.querySelector('.out').addEventListener('click', () => showBatchMovementDialog('out').catch(error => window.alert(error.message || '无法打开出库单。')));
  welcome.insertAdjacentElement('afterend', card);
}

function goToPage(name) {
  [...document.querySelectorAll('.side nav button')].find(button => button.textContent.includes(name))?.click();
}

function installMoreFunctionList() {
  const grid = document.querySelector('.partner-grid');
  if (!grid || document.querySelector('header h1')?.textContent.trim() !== '更多功能' || document.getElementById('wb-more-functions')) return;
  const card = document.createElement('article');
  card.id = 'wb-more-functions';
  card.className = 'panel wb-more-functions';
  card.innerHTML = `<h3>功能列表</h3>
    <button class="wb-more-function" data-action="backup"><i>⇩</i><span><b>数据备份</b><small>备份、恢复与清理本机数据</small></span><em>›</em></button>
    <button class="wb-more-function" data-action="report"><i>▤</i><span><b>生成月报</b><small>按客户生成并保存月报快照</small></span><em>›</em></button>
    <button class="wb-more-function" data-action="customers"><i>♧</i><span><b>客户与供应商</b><small>查看客户统计、管理往来单位</small></span><em>›</em></button>
    <button class="wb-more-function" data-action="initialize"><i>↕</i><span><b>初始化数据</b><small>导入模板前可先清理测试数据</small></span><em>›</em></button>
    <button class="wb-more-function" data-action="logout"><i>↪</i><span><b>退出登录</b><small>退出当前账号，不会删除库存数据</small></span><em>›</em></button>`;
  card.querySelector('[data-action="backup"]').addEventListener('click', () => goToPage('数据备份'));
  card.querySelector('[data-action="report"]').addEventListener('click', () => showCreateReportDialog(null));
  card.querySelector('[data-action="customers"]').addEventListener('click', () => grid.querySelector('.panel:not(#wb-more-functions)')?.scrollIntoView({ behavior:'smooth', block:'start' }));
  card.querySelector('[data-action="initialize"]').addEventListener('click', showInitializeDialog);
  card.querySelector('[data-action="logout"]').addEventListener('click', logout);
  grid.prepend(card);
}

let loadingAlerts = false;
function installCustomerAlerts() {
  const grid = document.querySelector('.partner-grid');
  if (!grid || document.querySelector('header h1')?.textContent.trim() !== '库存预警' || document.getElementById('wb-alert-card') || loadingAlerts) return;
  loadingAlerts = true;
  Promise.all([createLocalApi()('/partners'), createLocalApi()('/products')]).then(([partners, products]) => {
    if (!document.contains(grid) || document.querySelector('header h1')?.textContent.trim() !== '库存预警') return;
    [...grid.children].forEach(child => { child.hidden = true; });
    const card = document.createElement('article');
    card.id = 'wb-alert-card';
    card.className = 'panel wb-alert-card';
    card.innerHTML = `<div class="wb-alert-head"><div><h3>库存预警</h3><small>库存小于或等于安全库存的商品</small></div><select class="wb-customer-filter" aria-label="选择客户"><option value="">全部客户</option>${partners.customers.map(customer => `<option value="${textForHtml(customer.id)}">${textForHtml(customer.name)}</option>`).join('')}</select></div><div class="wb-alert-list"></div>`;
    const select = card.querySelector('select');
    const list = card.querySelector('.wb-alert-list');
    const render = () => {
      const rows = products.filter(product => (!select.value || product.customerId === select.value) && Number(product.stock || 0) <= Number(product.safeStock || 0));
      list.innerHTML = rows.map(product => `<div class="wb-alert-item"><i>!</i><div><b>${textForHtml(product.name)}</b><span>${textForHtml(product.customerName || '未指定客户')} · ${textForHtml(product.location || '未设置库位')}</span></div><strong>${Number(product.stock || 0)} ${textForHtml(product.unit || '')}<small>安全库存 ${Number(product.safeStock || 0)}</small></strong></div>`).join('') || '<p class="empty">该客户暂无库存预警。</p>';
    };
    select.addEventListener('change', render);
    render();
    grid.prepend(card);
  }).finally(() => { loadingAlerts = false; });
}

function openCustomerMovements(customerId) {
  movementCustomerFilter = customerId;
  const movementButton = document.querySelector('.mobile-nav button:nth-child(3)') || [...document.querySelectorAll('.side nav button')].find(button => button.textContent.includes('出入库流水'));
  movementButton?.click();
}

let loadingHomeCustomerList = false;
function installHomeCustomerList() {
  const dashboard = document.querySelector('.dashboard');
  const flow = document.getElementById('wb-flow-summary');
  if (!dashboard || !flow || document.getElementById('wb-home-customers') || loadingHomeCustomerList) return;
  loadingHomeCustomerList = true;
  Promise.all([createLocalApi()('/partners'), createLocalApi().exportState()]).then(([partners, backup]) => {
    if (!document.contains(flow)) return;
    const card = document.createElement('section');
    card.id = 'wb-home-customers'; card.className = 'panel wb-home-customers';
    const data = backup.data;
    card.innerHTML = `<h3>客户统计</h3>${partners.customers.map(customer => { const products = data.products.filter(item => item.customerId === customer.id); const movements = data.movements.filter(item => item.customerId === customer.id); const stock = products.reduce((sum, item) => sum + Number(item.stock || 0), 0); const inbound = movements.filter(item => item.type === 'in').reduce((sum, item) => sum + Number(item.quantity || 0), 0); const outbound = movements.filter(item => item.type === 'out').reduce((sum, item) => sum + Number(item.quantity || 0), 0); return `<div class="wb-home-customer"><div><b>${textForHtml(customer.name)}</b><span>商品 ${products.length} · 库存 ${stock} · 入库 ${inbound} · 出库 ${outbound}</span></div><div><button data-stat="${textForHtml(customer.id)}">看统计</button><button class="flow" data-flow="${textForHtml(customer.id)}">看流水</button></div></div>`; }).join('') || '<p class="empty">请先建立客户并关联库存。</p>'}`;
    card.querySelectorAll('button[data-stat]').forEach(button => button.addEventListener('click', () => openCustomerDashboard(button.dataset.stat)));
    card.querySelectorAll('button[data-flow]').forEach(button => button.addEventListener('click', () => openCustomerMovements(button.dataset.flow)));
    flow.insertAdjacentElement('afterend', card);
  }).finally(() => { loadingHomeCustomerList = false; });
}

let productCustomerFilter = '';
let loadingCustomerFilter = false;
function installCustomerProductFilter() {
  const table = document.querySelector('.table-panel table');
  const head = document.querySelector('.table-panel .table-head');
  if (!table || !head || table.querySelector('thead th')?.textContent.trim() !== '商品信息' || loadingCustomerFilter) return;
  let select = document.getElementById('wb-customer-filter');
  if (select) return;
  loadingCustomerFilter = true;
  Promise.all([createLocalApi()('/partners'), createLocalApi()('/products')]).then(([partners, products]) => {
    if (!document.contains(head)) return;
    select = document.createElement('select');
    select.id = 'wb-customer-filter';
    select.className = 'wb-customer-filter';
    productCustomerFilter ||= partners.customers[0]?.id || '';
    select.innerHTML = partners.customers.length ? partners.customers.map(customer => `<option value="${textForHtml(customer.id)}">${textForHtml(customer.name)}</option>`).join('') : '<option value="">暂无客户</option>';
    select.value = productCustomerFilter;
    const apply = () => {
      productCustomerFilter = select.value;
      table.querySelectorAll('tbody tr').forEach(row => {
        const name = row.cells[0]?.querySelector('b')?.textContent.trim();
        const sku = row.cells[0]?.querySelector('small')?.textContent.trim();
        const category = row.cells[1]?.textContent.trim();
        const product = products.find(item => item.name === name && item.sku === sku && item.category === category);
        row.style.display = !productCustomerFilter || product?.customerId === productCustomerFilter ? '' : 'none';
      });
    };
    select.addEventListener('change', apply);
    head.append(select);
    const filterButton = head.querySelector('.filter');
    if (filterButton && !filterButton.dataset.customerBound) {
      filterButton.dataset.customerBound = 'true';
      filterButton.addEventListener('click', event => { event.preventDefault(); select.focus(); select.click(); }, true);
    }
    apply();
  }).finally(() => { loadingCustomerFilter = false; });
}

function openCustomerDashboard(customerId) {
  dashboardCustomerId = customerId;
  const dashboardButton = document.querySelector('.mobile-nav button:first-child, .side nav button:first-child');
  dashboardButton?.click();
  setTimeout(() => { document.getElementById('wb-dashboard-customer')?.dispatchEvent(new Event('change')); }, 30);
}

function installCustomerStatistics() {
  const grid = document.querySelector('.partner-grid');
  if (!grid || document.querySelector('header h1')?.textContent.trim() !== '更多功能' || document.getElementById('wb-customer-stats')) return;
  Promise.all([createLocalApi()('/partners'), createLocalApi().exportState()]).then(([partners, backup]) => {
    if (!document.contains(grid)) return;
    const card = document.createElement('article');
    card.id = 'wb-customer-stats';
    card.className = 'panel wb-customer-stats';
    const data = backup.data;
    card.innerHTML = `<div class="panel-title"><h3>客户统计列表</h3><span class="badge purple">${partners.customers.length} 家</span></div>${partners.customers.map(customer => { const products = data.products.filter(item => item.customerId === customer.id); const movements = data.movements.filter(item => item.customerId === customer.id); const inbound = movements.filter(item => item.type === 'in').reduce((sum, item) => sum + Number(item.quantity || 0), 0); const outbound = movements.filter(item => item.type === 'out').reduce((sum, item) => sum + Number(item.quantity || 0), 0); return `<div class="wb-customer-stat-row"><b>${textForHtml(customer.name)}</b><span>商品<br/>${products.length}</span><span>入库<br/>${inbound}</span><span>出库<br/>${outbound}</span><button data-customer-id="${textForHtml(customer.id)}">看统计</button></div>`; }).join('') || '<p class="empty">尚未建立客户。</p>'}`;
    card.querySelectorAll('button[data-customer-id]').forEach(button => button.addEventListener('click', () => openCustomerDashboard(button.dataset.customerId)));
    grid.prepend(card);
  });
}

let movementCustomerFilter = '';
function installMovementCustomerFilter() {
  const table = document.querySelector('.table-panel table');
  const head = document.querySelector('.table-panel .table-head');
  if (!table || !head || table.querySelector('thead th')?.textContent.trim() !== '单据编号' || document.getElementById('wb-movement-customer-filter')) return;
  Promise.all([createLocalApi()('/partners'), createLocalApi()('/movements')]).then(([partners, movements]) => {
    if (!document.contains(head)) return;
    const select = document.createElement('select');
    select.id = 'wb-movement-customer-filter'; select.className = 'wb-customer-filter';
    select.innerHTML = `<option value="">全部客户</option>${partners.customers.map(customer => `<option value="${textForHtml(customer.id)}">${textForHtml(customer.name)}</option>`).join('')}`;
    select.value = movementCustomerFilter;
    const apply = () => {
      movementCustomerFilter = select.value;
      table.querySelectorAll('tbody tr').forEach(row => {
        const id = row.cells[0]?.textContent.trim();
        const movement = movements.find(item => item.id === id);
        row.style.display = !movementCustomerFilter || movement?.customerId === movementCustomerFilter ? '' : 'none';
        const productCell = row.cells[2];
        if (movement && productCell && !productCell.querySelector('.wb-movement-customer')) { const mark = document.createElement('small'); mark.className = 'wb-movement-customer'; mark.textContent = `客户：${movement.customerName || '待指定'}`; productCell.append(mark); }
      });
    };
    select.addEventListener('change', apply); head.append(select); apply();
  });
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

function enablePageTopReset() {
  if (document.documentElement.dataset.wbTopReset) return;
  document.documentElement.dataset.wbTopReset = 'true';
  document.addEventListener('click', event => {
    if (!event.target.closest('.mobile-nav button, .side nav button, .more-sheet button')) return;
    setTimeout(() => window.scrollTo({ top:0, left:0, behavior:'auto' }), 0);
  });
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
  installDashboardCustomerScope();
  installDashboardQuickActions();
  installHomeFlowStats();
  installHomeCustomerList();
  installCustomerProductFilter();
  installMoreFunctionList();
  installCustomerAlerts();
  installCustomerStatistics();
  installMovementCustomerFilter();
  installProductRemarks();
  installMoreInitialization();
  installMoreReportGenerator();
  installMoreLogout();
}

export function installLocalShell() {
  injectStyle();
  enableAutomaticUpdates();
  enablePageTopReset();
  const refresh = () => { installAccountChip(); installPageActions(); };
  new MutationObserver(refresh).observe(document.body, { childList:true, subtree:true });
  if (ACCOUNTS[localStorage.getItem(SESSION_KEY)]) setTimeout(refresh, 0); else showLogin();
}
