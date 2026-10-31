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
      const customer = data.customers.find(item => item.id === payload.customerId);
      if (!customer) throw new Error('请先选择库存归属客户');
      const product = { id:`P${Date.now().toString().slice(-6)}`, name:payload.name, sku:payload.sku, category:payload.category || '其他', spec:payload.spec || '', unit:payload.unit || '件', openingStock:Number(payload.openingStock ?? payload.stock) || 0, stock:Number(payload.stock) || 0, safeStock:Number(payload.safeStock) || 0, cost:Number(payload.cost) || 0, price:Number(payload.price) || 0, location:payload.location || '待分配', remark:payload.remark || '', customerId:customer.id, customerName:customer.name };
      data.products.unshift(product); await save(data); return product;
    }
    if (url === '/partners') {
      const type = payload.type === 'supplier' ? 'supplier' : 'customer';
      const name = String(payload.name || '').trim();
      if (!name) throw new Error(`请填写${type === 'supplier' ? '供应商' : '客户'}名称`);
      const list = type === 'supplier' ? data.suppliers : data.customers;
      const existing = list.find(item => item.name === name);
      if (existing) return existing;
      const partner = { id:`${type === 'supplier' ? 'SUP':'CUS'}${Date.now()}`, name, contact:String(payload.contact || '').trim(), phone:String(payload.phone || '').trim(), createdAt:now() };
      list.unshift(partner); await save(data); return partner;
    }
    if (url === '/movements') {
      const product = data.products.find(item => item.id === payload.productId);
      const quantity = Number(payload.quantity);
      if (!product || !['in','out'].includes(payload.type) || !Number.isFinite(quantity) || quantity <= 0) throw new Error('请完整填写业务单据');
      if (payload.type === 'out' && product.stock < quantity) throw new Error('当前库存不足，无法出库');
      const customer = data.customers.find(item => item.id === payload.customerId);
      if (!customer) throw new Error('请选择库存归属客户');
      if (!product.customerId || product.customerId !== customer.id) throw new Error('所选商品不属于该客户，请重新选择客户或商品');
      product.stock += payload.type === 'in' ? quantity : -quantity;
      const price = Number(payload.price) || (payload.type === 'in' ? product.cost : product.price);
      const partner = payload.type === 'out' ? (String(payload.partner || '').trim() || customer.name) : (String(payload.partner || '').trim() || '未填写');
      if (payload.type === 'in' && partner !== '未填写' && !data.suppliers.some(item => item.name === partner)) {
        data.suppliers.unshift({ id:`SUP${Date.now()}`, name:partner, contact:'', phone:'', createdAt:now() });
      }
      const item = { id:`${payload.type === 'in' ? 'RK':'CK'}${Date.now()}`, type:payload.type, productId:product.id, productName:product.name, quantity, amount:+(quantity * price).toFixed(2), partner, customerId:customer.id, customerName:customer.name, operator:payload.operator || '管理员', createdAt:now(), note:payload.note || '' };
      data.movements.unshift(item); await save(data); return item;
    }
    if (url === '/movements/batch') {
      const customer = data.customers.find(item => item.id === payload.customerId);
      const entries = Array.isArray(payload.items) ? payload.items : [];
      if (!customer) throw new Error('请选择库存归属客户');
      if (!entries.length) throw new Error('请至少添加一件商品');
      const items = entries.map((entry, index) => {
        const product = data.products.find(item => item.id === entry.productId);
        const quantity = Number(entry.quantity);
        if (!product || !Number.isFinite(quantity) || quantity <= 0) throw new Error(`第 ${index + 1} 行商品或数量不正确`);
        if (!product.customerId || product.customerId !== customer.id) throw new Error(`“${product.name}”不属于所选客户`);
        return { product, quantity, price:Number(entry.price), note:String(entry.note || '').trim() };
      });
      const outgoing = new Map();
      if (payload.type === 'out') {
        items.forEach(item => outgoing.set(item.product.id, (outgoing.get(item.product.id) || 0) + item.quantity));
        outgoing.forEach((quantity, productId) => {
          const product = data.products.find(item => item.id === productId);
          if (product.stock < quantity) throw new Error(`“${product.name}”库存不足，无法出库`);
        });
      }
      if (!['in','out'].includes(payload.type)) throw new Error('业务类型不正确');
      const partner = payload.type === 'out' ? (String(payload.partner || '').trim() || customer.name) : (String(payload.partner || '').trim() || '未填写');
      if (payload.type === 'in' && partner !== '未填写' && !data.suppliers.some(item => item.name === partner)) data.suppliers.unshift({ id:`SUP${Date.now()}`, name:partner, contact:'', phone:'', createdAt:now() });
      const createdAt = now(), timestamp = Date.now();
      const records = items.map((item, index) => {
        item.product.stock += payload.type === 'in' ? item.quantity : -item.quantity;
        const price = Number.isFinite(item.price) && item.price >= 0 ? item.price : (payload.type === 'in' ? item.product.cost : item.product.price);
        return { id:`${payload.type === 'in' ? 'RK':'CK'}${timestamp}-${index + 1}`, type:payload.type, productId:item.product.id, productName:item.product.name, quantity:item.quantity, amount:+(item.quantity * price).toFixed(2), partner, customerId:customer.id, customerName:customer.name, operator:String(payload.operator || '管理员').trim() || '管理员', createdAt, note:item.note || String(payload.note || '').trim() };
      });
      data.movements.unshift(...records); await save(data); return records;
    }
    throw new Error('本地功能不存在');
  };
  api.exportState = async () => ({ version: 1, app: 'WareBoss Local', exportedAt: new Date().toISOString(), data: clone(await state()) });
  api.importState = async backup => {
    const data = backup?.data || backup;
    if (!data || !['products','suppliers','customers','movements'].every(key => Array.isArray(data[key]))) throw new Error('备份文件格式不正确');
    await save({ products:data.products, suppliers:data.suppliers, customers:data.customers, movements:data.movements, reports:Array.isArray(data.reports) ? data.reports : [] });
  };
  api.importCustomerState = async (backup, customerId) => {
    const incoming = backup?.data || backup;
    if (!incoming || !['products','suppliers','customers','movements'].every(key => Array.isArray(incoming[key]))) throw new Error('导入文件格式不正确');
    const data = await state();
    const customer = data.customers.find(item => item.id === customerId);
    if (!customer) throw new Error('请选择库存归属客户');
    const stamp = Date.now().toString();
    const productIds = new Map();
    const products = incoming.products.map((item, index) => {
      const id = `IMP-P${stamp}-${index + 1}`;
      productIds.set(item.id, id);
      return { ...item, id, customerId:customer.id, customerName:customer.name };
    });
    const movements = incoming.movements.map((item, index) => ({ ...item, id:`IMP-M${stamp}-${index + 1}`, productId:productIds.get(item.productId) || item.productId, customerId:customer.id, customerName:customer.name }));
    data.products = data.products.filter(item => item.customerId !== customer.id);
    data.movements = data.movements.filter(item => item.customerId !== customer.id);
    data.suppliers = [...incoming.suppliers, ...data.suppliers].filter((item, index, list) => item?.name && list.findIndex(other => other.name === item.name) === index);
    data.products.unshift(...products);
    data.movements.unshift(...movements);
    await save(data);
    return { productCount:products.length, movementCount:movements.length };
  };
  api.listReportSnapshots = async () => clone((await state()).reports);
  api.createReportSnapshot = async (note, snapshotData = null) => {
    const data = await state();
    const createdAt = new Date().toISOString();
    const reportData = snapshotData || { products:data.products, suppliers:data.suppliers, customers:data.customers, movements:data.movements };
    const snapshot = { id:`REPORT-${Date.now()}`, createdAt, note:String(note || '').slice(0, 120), data:clone(reportData) };
    data.reports.unshift(snapshot);
    await save(data);
    return clone(snapshot);
  };
  api.deleteReportSnapshot = async id => {
    const data = await state();
    data.reports = data.reports.filter(item => item.id !== id);
    await save(data);
  };
  api.clearCustomerData = async customerId => {
    const data = await state();
    if (!data.customers.some(item => item.id === customerId)) throw new Error('客户不存在或已被删除');
    data.products = data.products.filter(item => item.customerId !== customerId);
    data.movements = data.movements.filter(item => item.customerId !== customerId);
    data.customers = data.customers.filter(item => item.id !== customerId);
    data.reports = data.reports.filter(report => !report.data?.products?.some(item => item.customerId === customerId));
    await save(data);
  };
  api.assignUnassignedCustomer = async customerId => {
    const data = await state();
    const customer = data.customers.find(item => item.id === customerId);
    if (!customer) throw new Error('客户不存在');
    data.products.forEach(product => { if (!product.customerId) { product.customerId = customer.id; product.customerName = customer.name; } });
    data.movements.forEach(item => { if (!item.customerId) { item.customerId = customer.id; item.customerName = customer.name; } });
    data.reports.forEach(report => { report.data?.products?.forEach(product => { if (!product.customerId) { product.customerId = customer.id; product.customerName = customer.name; } }); report.data?.movements?.forEach(item => { if (!item.customerId) { item.customerId = customer.id; item.customerName = customer.name; } }); });
    await save(data);
  };
  api.clearState = async () => { await save(emptyState()); };
  return api;
}
