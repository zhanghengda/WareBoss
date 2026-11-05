const appRoot = document.getElementById('app');

function showBootError(error) {
  if (!appRoot || appRoot.dataset.bootError) return;
  appRoot.dataset.bootError = 'true';
  const message = String(error?.message || error || '未知启动错误');
  appRoot.innerHTML = `<main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f5f8f7;color:#173b38;font-family:system-ui,-apple-system,'Microsoft YaHei',sans-serif"><section style="width:min(92vw,440px);padding:26px;border-radius:18px;background:#fff;box-shadow:0 14px 38px #0d776922"><h1 style="margin:0 0 10px;font-size:20px">WareBoss 启动异常</h1><p style="line-height:1.65;color:#5e7471">页面代码未能完成启动。本地库存、客户和流水没有被删除。</p><pre style="white-space:pre-wrap;word-break:break-word;padding:12px;border-radius:9px;background:#fff4f2;color:#a2423f;font-size:12px">${message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</pre><button type="button" style="border:0;border-radius:9px;padding:10px 14px;background:#0d7769;color:#fff;font:600 14px inherit;cursor:pointer" onclick="location.reload()">重新加载</button></section></main>`;
}

window.addEventListener('error', event => showBootError(event.error || event.message));
window.addEventListener('unhandledrejection', event => showBootError(event.reason));
window.addEventListener('wareboss:boot-error', event => showBootError(event.detail));

import('./app.js?v=20261105.36').catch(showBootError);

setTimeout(() => {
  if (appRoot && !appRoot.querySelector('.shell')) showBootError('启动超时：前端界面没有完成挂载。请把控制台的第一条红色错误发给技术支持。');
}, 6000);
