const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, 'node_modules', 'vue', 'dist', 'vue.esm-browser.prod.js');
const xlsxSource = path.join(root, 'node_modules', 'xlsx', 'xlsx.mjs');
const xlsxStyleSource = path.join(root, 'node_modules', 'xlsx-js-style', 'dist', 'xlsx.min.js');
const vendor = path.join(root, 'web', 'vendor');
if (!fs.existsSync(source)) throw new Error('Vue 依赖未安装。请先执行 npm install。');
fs.mkdirSync(vendor, { recursive: true });
fs.copyFileSync(source, path.join(vendor, 'vue.js'));
fs.copyFileSync(xlsxSource, path.join(vendor, 'xlsx.mjs'));
fs.copyFileSync(xlsxStyleSource, path.join(vendor, 'xlsx-style.js'));
console.log('Static site prepared in web/');
