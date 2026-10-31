const DB_NAME = 'wareboss-local';
const STORE_NAME = 'state';
const STATE_ID = 'main';

const emptyState = () => ({ products: [], suppliers: [], customers: [], movements: [], reports: [] });
const clone = value => JSON.parse(JSON.stringify(value));
const now = () => new Intl.DateTimeFormat('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date()).replaceAll('/','-').replace(',','');
const normalizeState = value => ({ ...emptyState(), ...(value || {}), reports:Array.isArray(value?.reports) ? value.reports : [] });

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function requestResult(request) {
  return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
}

export function createLocalApi() {
  let database;
  async function db() { if (!database) database = await openDatabase(); return database; }
  async function state() {
    const connection = await db();
    const record = await requestResult(connection.transaction(STORE_NAME).objectStore(STORE_NAME).get(STATE_ID));
    if (record) return normalizeState(record.value);
    const value = emptyState();
    await save(value);
    return value;
  }
  async function save(value) {
    const connection = await db();
    const transaction = connection.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put({ id: STATE_ID, value: clone(value), updatedAt: new Date().toISOString() });
    await new Promise((resolve, reject) => { transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error); });
  }
  const overview = data => {
    const today = new Date().toISOString().slice(0, 10);
    const todayRows = data.movements.filter(item => item.createdAt.startsWith(today));
    return {
      productKinds: data.products.length,
      stockTotal: data.products.reduce((sum, item) => sum + item.stock, 0),
      lowStock: data.products.filter(item => item.stock <= item.safeStock),
      inAmount: todayRows.filter(item => item.type === 'in').reduce((sum, item) => sum + item.amount, 0),
      outAmount: todayRows.filter(item => item.type === 'out').reduce((sum, item) => sum + item.amount, 0),
      recent: data.movements.slice(0, 6),
      storage: 'device-local'
    };
  };
  const api = async (url, options = {}) => {
    const data = await state();
    if (!options.method || options.method === 'GET') {
      if (url === '/overview') return overview(data);
      if (url === '/products') return data.products;
      if (url === '/movements') return data.movements;
      if (url === '/partners') return { suppliers: data.suppliers, customers: data.customers };
      throw new Error('本地功能不存在');
    }
    const payload = JSON.parse(options.body || '{}');
    if (url === '/products') {
      if (!payload.name || !payload.sku) throw new Error('请填写商品名称和编码');
      if (data.products.some(item => item.sku === payload.sku && (item.category || '') === (payload.category || '其他') && (item.spec || '') === (payload.spec || ''))) throw new Error('该系列、商品编码和规格已存在');
      const product = { id:`P${Date.now().toString().slice(-6)}`, name:payload.name, sku:payload.sku, category:payload.category || '其他', spec:payload.spec || '', unit:payload.unit || '件', openingStock:Number(payload.openingStock ?? payload.stock) || 0, stock:Number(payload.stock) || 0, safeStock:Number(payload.safeStock) || 0, cost:Number(payload.cost) || 0, price:Number(payload.price) || 0, location:payload.location || '待分配', remark:payload.remark || '' };
      data.products.unshift(product); await save(data); return product;
    }
    if (url === '/movements') {
      const product = data.products.find(item => item.id === payload.productId);
      const quantity = Number(payload.quantity);
      if (!product || !['in','out'].includes(payload.type) || !Number.isFinite(quantity) || quantity <= 0) throw new Error('请完整填写业务单据');
      if (payload.type === 'out' && product.stock < quantity) throw new Error('当前库存不足，无法出库');
      product.stock += payload.type === 'in' ? quantity : -quantity;
      const price = Number(payload.price) || (payload.type === 'in' ? product.cost : product.price);
      const partner = String(payload.partner || '').trim() || '未填写';
      const partnerList = payload.type === 'in' ? data.suppliers : data.customers;
      if (partner !== '未填写' && !partnerList.some(item => item.name === partner)) {
        partnerList.unshift({ id:`${payload.type === 'in' ? 'SUP':'CUS'}${Date.now()}`, name:partner, contact:'', phone:'', createdAt:now() });
      }
      const item = { id:`${payload.type === 'in' ? 'RK':'CK'}${Date.now()}`, type:payload.type, productId:product.id, productName:product.name, quantity, amount:+(quantity * price).toFixed(2), partner, operator:payload.operator || '管理员', createdAt:now(), note:payload.note || '' };
      data.movements.unshift(item); await save(data); return item;
    }
    throw new Error('本地功能不存在');
  };
  api.exportState = async () => ({ version: 1, app: 'WareBoss Local', exportedAt: new Date().toISOString(), data: clone(await state()) });
  api.importState = async backup => {
    const data = backup?.data || backup;
    if (!data || !['products','suppliers','customers','movements'].every(key => Array.isArray(data[key]))) throw new Error('备份文件格式不正确');
    await save({ products:data.products, suppliers:data.suppliers, customers:data.customers, movements:data.movements, reports:Array.isArray(data.reports) ? data.reports : [] });
  };
  api.listReportSnapshots = async () => clone((await state()).reports);
  api.createReportSnapshot = async note => {
    const data = await state();
    const createdAt = new Date().toISOString();
    const snapshot = { id:`REPORT-${Date.now()}`, createdAt, note:String(note || '').slice(0, 120), data:clone({ products:data.products, suppliers:data.suppliers, customers:data.customers, movements:data.movements }) };
    data.reports.unshift(snapshot);
    await save(data);
    return clone(snapshot);
  };
  api.deleteReportSnapshot = async id => {
    const data = await state();
    data.reports = data.reports.filter(item => item.id !== id);
    await save(data);
  };
  api.clearState = async () => { await save(emptyState()); };
  return api;
}
