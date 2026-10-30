const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { initStore, read, mutate, provider } = require('./store');

const root = path.join(__dirname, '..');
const webRoot = path.join(root, 'web');
const json = (res, status, body) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(body)); };
const body = req => new Promise((resolve, reject) => { let raw=''; req.on('data', d => raw += d); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('请求数据格式错误')); } }); });
const stamp = () => new Intl.DateTimeFormat('zh-CN', {timeZone:'Asia/Shanghai', year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()).replaceAll('/','-').replace(',','');

function overview(data) {
  const today = new Date().toISOString().slice(0, 10);
  const dayRows = data.movements.filter(m => m.createdAt.startsWith(today));
  const inAmount = dayRows.filter(m => m.type === 'in').reduce((s,m) => s + m.amount, 0);
  const outAmount = dayRows.filter(m => m.type === 'out').reduce((s,m) => s + m.amount, 0);
  return { productKinds:data.products.length, stockTotal:data.products.reduce((s,p)=>s+p.stock,0), lowStock:data.products.filter(p=>p.stock<=p.safeStock), inAmount, outAmount, recent:data.movements.slice(0,6) };
}

function staticFile(req, res) {
  const requested = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const isVueVendor = requested === '/vendor/vue.js';
  const file = isVueVendor ? path.join(root, 'node_modules', 'vue', 'dist', 'vue.esm-browser.prod.js') : path.normalize(path.join(webRoot, requested));
  if ((!isVueVendor && !file.startsWith(webRoot)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return json(res, 404, {message:'页面不存在'});
  const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json; charset=utf-8'};
  res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/api/')) return staticFile(req, res);
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, {ok:true, storage:provider()});
    const data = await read();
    if (req.method === 'GET' && url.pathname === '/api/overview') return json(res, 200, {...overview(data), storage:provider()});
    if (req.method === 'GET' && url.pathname === '/api/products') return json(res, 200, data.products);
    if (req.method === 'GET' && url.pathname === '/api/movements') return json(res, 200, data.movements);
    if (req.method === 'GET' && url.pathname === '/api/partners') return json(res, 200, {suppliers:data.suppliers, customers:data.customers});
    if (req.method === 'POST' && url.pathname === '/api/products') {
      const p = await body(req);
      let product;
      await mutate(state => {
        if (!p.name || !p.sku) throw Object.assign(new Error('请填写商品名称和编码'), {statusCode:400});
        if (state.products.some(x => x.sku === p.sku)) throw Object.assign(new Error('该商品编码已存在'), {statusCode:400});
        product = {id:`P${Date.now().toString().slice(-6)}`,name:p.name,sku:p.sku,category:p.category || '其他',unit:p.unit || '件',stock:Number(p.stock)||0,safeStock:Number(p.safeStock)||0,cost:Number(p.cost)||0,price:Number(p.price)||0,location:p.location || '待分配'};
        state.products.unshift(product);
      });
      return json(res, 201, product);
    }
    if (req.method === 'POST' && url.pathname === '/api/movements') {
      const m = await body(req); const qty = Number(m.quantity); const type = m.type; let item;
      await mutate(state => {
        const product = state.products.find(p => p.id === m.productId);
        if (!product || !['in','out'].includes(type) || !Number.isFinite(qty) || qty <= 0) throw Object.assign(new Error('请完整填写业务单据'), {statusCode:400});
        if (type === 'out' && product.stock < qty) throw Object.assign(new Error('当前库存不足，无法出库'), {statusCode:400});
        product.stock += type === 'in' ? qty : -qty;
        const price = Number(m.price) || (type === 'in' ? product.cost : product.price);
        item = {id:`${type === 'in' ? 'RK':'CK'}${Date.now()}`,type,productId:product.id,productName:product.name,quantity:qty,amount:+(qty*price).toFixed(2),partner:m.partner || '未填写',operator:m.operator || '管理员',createdAt:stamp(),note:m.note || '',uuid:randomUUID()};
        state.movements.unshift(item);
      });
      return json(res, 201, item);
    }
    return json(res, 404, {message:'接口不存在'});
  } catch (error) { return json(res, error.statusCode || 500, {message:error.message || '服务器错误'}); }
});
initStore()
  .then(({provider}) => server.listen(process.env.PORT || 3000, () => console.log(`WareBoss (${provider}) running at http://localhost:${process.env.PORT || 3000}`)))
  .catch(error => { console.error('数据库初始化失败：', error.message); process.exit(1); });
