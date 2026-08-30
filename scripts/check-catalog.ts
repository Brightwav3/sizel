import fs from 'node:fs'
import path from 'node:path'
const root = process.cwd(); const products = JSON.parse(fs.readFileSync(path.join(root, 'public/catalog/products.json'), 'utf8'))
const required = ['Acme Labs','Adventure Works','Alpine Works','Contoso','Fabrikam','Fourth Castle','Litware','Northwind','Pear','Proseware','Tailspin','Woodgrove','Y-Ball']
const cats = ['cpu','gpu','motherboard','ram','storage','cpu-cooler','psu','pc-case']
const ids = new Set(products.map((p: any) => p.id)); const missing = products.filter((p: any) => !fs.existsSync(path.join(root, 'public/catalog', p.image_path)))
const checks = [['135 products loaded', products.length === 135], ['no duplicate IDs', ids.size === products.length], ['SQLite database copied', fs.existsSync(path.join(root, 'public/catalog/products.db'))], ['no missing image files', missing.length === 0], ['all brands represented', required.every(b => products.some((p: any) => p.brand === b))], ['all PC categories represented', cats.every(c => products.some((p: any) => p.category === c))]]
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (checks.some(([, ok]) => !ok)) process.exit(1)
