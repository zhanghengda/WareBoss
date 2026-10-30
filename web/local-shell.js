import { createLocalApi } from './local-store.js';

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
    .wb-login-card h1{font-size:22px;margin:0 0 8px}.wb-login-card p{margin:0 0 22px;color:#a8c7ce;line-height:1.65;font-size:14px}.wb-login-card label{display:grid;gap:7px;margin-top:14px;font-size:13px;font-weight:700}.wb-login-card input{box-sizing:border-box;width:100%;border:1px solid #2d6170;border-radius:10px;padding:12px;color:#ecfbff;background:#0a2530;font:inherit;outline:none}.wb-login-card input:focus{border-color:#63d7cf;box-shadow:0 0 0 3px rgba(99,215,207,.15)}.wb-login-card button{width:100%;margin-top:22px;border:0;border-radius:10px;padding:12px;background:#20a69b;color:white;font:700 15px inherit;cursor:pointer}.wb-login-error{min-height:19px;margin:10px 0 -11px;color:#ffaaa2;font-size:13px}.wb-account-chip{display:inline-flex;align-items:center;gap:8px;border:1px solid #d8e7ea;border-radius:9px;padding:7px 9px;background:white;color:#31505a;font-size:12px}.wb-account-chip button{border:0;border-left:1px solid #d8e7ea;background:transparent;color:#49717b;padding-left:8px;cursor:pointer;font:inherit}.wb-clear-overlay{position:fixed;inset:0;z-index:10001;display:grid;place-items:center;padding:24px;background:rgba(2,16,22,.66)}.wb-clear-dialog{width:min(100%,400px);border-radius:18px;background:white;padding:26px;color:#1d3942;box-shadow:0 25px 70px rgba(0,0,0,.3)}.wb-clear-dialog h2{margin:0 0 10px;font-size:20px}.wb-clear-dialog p{line-height:1.65;color:#5d7178}.wb-clear-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px}.wb-clear-actions button{border:0;border-radius:9px;padding:10px 14px;font:700 14px inherit;cursor:pointer}.wb-clear-actions .cancel{background:#eaf0f1;color:#42606a}.wb-clear-actions .confirm{background:#d95252;color:white}@media(max-width:640px){.wb-login-card{padding:28px 22px}.wb-account-chip{position:fixed;right:12px;top:10px;z-index:20}.wb-account-chip span{display:none}}
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
  chip.querySelector('button').addEventListener('click', () => { localStorage.removeItem(SESSION_KEY); chip.remove(); showLogin(); });
  header.prepend(chip);
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
}

export function installLocalShell() {
  injectStyle();
  const refresh = () => { installAccountChip(); installPageActions(); };
  new MutationObserver(refresh).observe(document.body, { childList:true, subtree:true });
  if (ACCOUNTS[localStorage.getItem(SESSION_KEY)]) setTimeout(refresh, 0); else showLogin();
}
