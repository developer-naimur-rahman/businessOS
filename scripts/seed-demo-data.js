const fs = require('fs');

async function main() {
  const baseUrl = 'http://localhost:3333/api';
  const pin = '5825825825iW.';

  const log = (msg) => console.log(`[SEED] ${msg}`);

  log('Authenticating as Admin...');
  let res = await fetch(`${baseUrl}/auth/admin-pin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  const { access_token } = await res.json();
  const headers = {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  };

  const get = async (path) => {
    const r = await fetch(`${baseUrl}${path}`, { headers });
    if (!r.ok) throw new Error(`GET ${path} failed: ${await r.text()}`);
    return r.json();
  };
  const post = async (path, data) => {
    const r = await fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(`POST ${path} failed: ${await r.text()}`);
    return r.json();
  };

  log('Fetching setup structures (Branches, Warehouses)...');
  let branches = await get('/operational-structure/branches');
  if (branches.length === 0) {
    await post('/operational-structure/branches', { name: 'Main Branch', location: 'Dhaka' });
    branches = await get('/operational-structure/branches');
  }
  const branchId = branches[0].id;

  let warehouses = await get('/operational-structure/warehouses');
  if (warehouses.length === 0) {
    await post('/operational-structure/warehouses', { name: 'Main Warehouse', branchId, isDefault: true });
    warehouses = await get('/operational-structure/warehouses');
  }
  const warehouseId = warehouses[0].id;

  log('Ensuring Units exist...');
  const existingUnits = await get('/business-core/units');
  const unitMap = {};
  for (const u of existingUnits) unitMap[u.name] = u.id;
  const unitNames = ['Piece', 'Page', 'Copy', 'Service', 'Set'];
  for (const name of unitNames) {
    if (!unitMap[name]) {
      const u = await post('/business-core/units', { name, abbreviation: name.substring(0, 3).toUpperCase() });
      unitMap[name] = u.id;
    }
  }

  log('Ensuring Categories exist...');
  const existingCats = await get('/business-core/categories');
  const catMap = {};
  for (const c of existingCats) catMap[c.name] = c.id;
  const categoryNames = ['Computer Accessories', 'Storage', 'Printing', 'Photocopy', 'Photography', 'Creative Services', 'Stationery', 'Online Services'];
  for (const name of categoryNames) {
    if (!catMap[name]) {
      const c = await post('/business-core/categories', { name, description: `Demo Category for ${name}` });
      catMap[name] = c.id;
    }
  }

  log('Ensuring Products exist...');
  const existingProducts = await get('/business-core/products');
  const prodMap = {};
  for (const p of existingProducts) prodMap[p.name] = p;

  const productsToCreate = [
    { name: 'Wireless Mouse', type: 'PRODUCT', category: 'Computer Accessories', unit: 'Piece', cost: 300, sell: 500, code: 'ACC-MOU-01', stock: 20 },
    { name: 'USB Keyboard', type: 'PRODUCT', category: 'Computer Accessories', unit: 'Piece', cost: 400, sell: 650, code: 'ACC-KEY-01', stock: 15 },
    { name: '64GB Pendrive', type: 'PRODUCT', category: 'Storage', unit: 'Piece', cost: 500, sell: 750, code: 'STO-PEN-64', stock: 25 },
    { name: '128GB Pendrive', type: 'PRODUCT', category: 'Storage', unit: 'Piece', cost: 900, sell: 1200, code: 'STO-PEN-128', stock: 15 },
    { name: 'HDMI Cable', type: 'PRODUCT', category: 'Computer Accessories', unit: 'Piece', cost: 150, sell: 300, code: 'ACC-CBL-HD', stock: 20 },
    { name: 'SSD 256GB', type: 'PRODUCT', category: 'Storage', unit: 'Piece', cost: 2000, sell: 2500, code: 'STO-SSD-256', stock: 8 },
    { name: 'RAM 8GB', type: 'PRODUCT', category: 'Computer Accessories', unit: 'Piece', cost: 1800, sell: 2200, code: 'ACC-RAM-08', stock: 10 },
    { name: 'Photo Paper 4R', type: 'PRODUCT', category: 'Stationery', unit: 'Piece', cost: 2, sell: 5, code: 'STA-PP-4R', stock: 300 },
    { name: 'A4 Printing Paper', type: 'PRODUCT', category: 'Stationery', unit: 'Set', cost: 300, sell: 400, code: 'STA-PP-A4', stock: 50 },
    { name: 'A4 Black & White Print', type: 'SERVICE', category: 'Printing', unit: 'Page', cost: 2, sell: 5, code: 'SRV-PRT-BWA4' },
    { name: 'A4 Color Print', type: 'SERVICE', category: 'Printing', unit: 'Page', cost: 5, sell: 15, code: 'SRV-PRT-CLA4' },
    { name: 'Photocopy A4', type: 'SERVICE', category: 'Photocopy', unit: 'Copy', cost: 1.5, sell: 3, code: 'SRV-CPY-A4' },
    { name: 'Passport Photography', type: 'SERVICE', category: 'Photography', unit: 'Service', cost: 0, sell: 100, code: 'SRV-PHO-PP' },
    { name: 'Wedding Photography', type: 'SERVICE', category: 'Photography', unit: 'Service', cost: 0, sell: 15000, code: 'SRV-PHO-WD' },
    { name: 'Online Form Fill-up', type: 'SERVICE', category: 'Online Services', unit: 'Service', cost: 0, sell: 50, code: 'SRV-ONL-FF' },
  ];

  let addedStockCount = 0;
  for (const p of productsToCreate) {
    if (!prodMap[p.name]) {
      const created = await post('/business-core/products', {
        name: p.name,
        type: p.type,
        categoryId: catMap[p.category],
        unitId: unitMap[p.unit],
        costPrice: p.cost,
        sellingPrice: p.sell,
        code: p.code,
      });
      prodMap[p.name] = created;

      // Add inventory if it's a product and needs stock
      if (p.type === 'PRODUCT' && p.stock) {
        await post('/inventory/adjustments', {
          warehouseId,
          productId: created.id,
          quantity: p.stock,
          type: 'ADJUSTMENT_IN',
          notes: 'Initial Opening Stock'
        });
        addedStockCount++;
      }
    }
  }

  log('Ensuring Suppliers exist...');
  const existingSuppliers = await get('/business-core/suppliers');
  const supMap = {};
  for (const s of existingSuppliers) supMap[s.name] = s.id;
  const supplierNames = ['Tech Accessories Ltd.', 'Paper House BD', 'Global Photographics', 'Computer Hardware Co.'];
  for (const name of supplierNames) {
    if (!supMap[name]) {
      const s = await post('/business-core/suppliers', { name, email: `info@${name.replace(/\s/g, '').toLowerCase()}.demo`, phone: '01700000000', address: 'Dhaka, BD' });
      supMap[name] = s.id;
    }
  }

  log('Ensuring Customers exist...');
  const existingCustomers = await get('/business-core/customers');
  const custMap = {};
  for (const c of existingCustomers) custMap[c.name] = c.id;
  
  const customerNames = [
    'Rahim Uddin', 'Karim Mia', 'Salam Hossain', 'Jamal Bhuiyan', 'Arif Rahman', 
    'Fatema Begum', 'Sumaiya Islam', 'Tasnim Akter', 'Hasan Mahmud', 'Imran Khan',
    'Local High School', 'City Bank Branch', 'Dhaka University Student', 'XYZ Small Business'
  ];
  for (let i = 0; i < customerNames.length; i++) {
    const name = customerNames[i];
    if (!custMap[name]) {
      const c = await post('/business-core/customers', { 
        name, 
        email: `customer${i}@demo.local`, 
        phone: `0171${String(Math.floor(Math.random() * 900000) + 100000)}`,
        address: 'Local Area'
      });
      custMap[name] = c.id;
    }
  }

  log('Generating Demo Sales...');
  // Check if we already have some sales
  const sales = await get('/sales');
  if (sales.length < 10) {
    // Sale 1: Walk-in, 64GB Pendrive + A4 Print. Fully paid cash.
    await post('/sales/complete-direct', {
      branchId, warehouseId,
      customerId: custMap['Rahim Uddin'],
      lines: [
        { productId: prodMap['64GB Pendrive'].id, quantity: 1, unitPrice: 750 },
        { productId: prodMap['A4 Black & White Print'].id, quantity: 20, unitPrice: 5 }
      ],
      payments: [{ method: 'CASH', amount: 850 }]
    });

    // Sale 2: Photography Service. Fully paid mobile banking.
    await post('/sales/complete-direct', {
      branchId, warehouseId,
      customerId: custMap['Fatema Begum'],
      lines: [
        { productId: prodMap['Passport Photography'].id, quantity: 1, unitPrice: 100 }
      ],
      payments: [{ method: 'MOBILE_BANKING', amount: 100 }]
    });

    // Sale 3: SSD + RAM. Partially paid bank transfer.
    await post('/sales/complete-direct', {
      branchId, warehouseId,
      customerId: custMap['XYZ Small Business'],
      lines: [
        { productId: prodMap['SSD 256GB'].id, quantity: 2, unitPrice: 2500 },
        { productId: prodMap['RAM 8GB'].id, quantity: 2, unitPrice: 2200 }
      ],
      payments: [{ method: 'BANK', amount: 5000 }] // Total is 9400, leaving 4400 outstanding
    });

    // Sale 4: Online Form Fill-up. Unpaid.
    await post('/sales/complete-direct', {
      branchId, warehouseId,
      customerId: custMap['Dhaka University Student'],
      lines: [
        { productId: prodMap['Online Form Fill-up'].id, quantity: 1, unitPrice: 50 }
      ],
      payments: [] // Unpaid
    });

    log('Triggering Finance Integration...');
    await fetch(`${baseUrl}/finance-integration/process`, { method: 'POST', headers });
  } else {
    log('Sales already exist, skipping sale generation.');
  }

  log('Seed process completed successfully!');
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
