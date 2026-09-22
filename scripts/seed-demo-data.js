const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

  log('Creating Demo Accounts...');
  const roles = [
    { name: 'Admin', email: 'admin@demo.local', pin: 'admin123' },
    { name: 'Manager', email: 'manager@demo.local', pin: 'manager1' },
    { name: 'Staff', email: 'staff@demo.local', pin: 'staff123' },
    { name: 'Sales', email: 'sales@demo.local', pin: 'sales123' },
    { name: 'Inventory', email: 'inventory@demo.local', pin: 'inv12345' }
  ];
  for (const role of roles) {
    const existing = await prisma.user.findFirst({ where: { email: role.email } });
    if (!existing) {
      log(`Creating account: ${role.email}`);
      await prisma.user.create({
        data: {
          organizationId: '1',
          email: role.email,
          firstName: role.name,
          lastName: 'Demo',
          password: 'password', // Placeholder
          isActive: true
        }
      });
    }
  }

  log('Fetching setup structures (Branches, Warehouses)...');
  let branches = await get('/operational-structure/branches');
  if (branches.length < 3) {
    const toCreate = [
      { name: 'Main Branch', location: 'Dhaka' },
      { name: 'North Branch', location: 'Sylhet' },
      { name: 'South Branch', location: 'Chittagong' }
    ];
    for (const b of toCreate) {
      if (!branches.find(x => x.name === b.name)) await post('/operational-structure/branches', b);
    }
    branches = await get('/operational-structure/branches');
  }

  let warehouses = await get('/operational-structure/warehouses');
  if (warehouses.length < 4) {
    const toCreate = [
      { name: 'Main Warehouse', branchId: branches[0].id, isDefault: true },
      { name: 'Secondary Storage', branchId: branches[0].id, isDefault: false },
      { name: 'North Warehouse', branchId: branches[1].id, isDefault: false },
      { name: 'South Warehouse', branchId: branches[2].id, isDefault: false }
    ];
    for (const w of toCreate) {
      if (!warehouses.find(x => x.name === w.name)) await post('/operational-structure/warehouses', w);
    }
    warehouses = await get('/operational-structure/warehouses');
  }

  log('Ensuring Units exist...');
  const existingUnits = await get('/business-core/units');
  const unitMap = {};
  for (const u of existingUnits) unitMap[u.name] = u.id;
  const unitNames = ['Piece', 'Page', 'Copy', 'Service', 'Set', 'Box', 'Kilogram', 'Meter'];
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
  const categoryNames = ['Computer Accessories', 'Storage', 'Printing', 'Photocopy', 'Photography', 'Creative Services', 'Stationery', 'Online Services', 'Networking', 'Audio'];
  for (const name of categoryNames) {
    if (!catMap[name]) {
      const c = await post('/business-core/categories', { name, description: `Demo Category for ${name}` });
      catMap[name] = c.id;
    }
  }

  log('Ensuring Products exist...');
  const productsResponse = await get('/products?pageSize=100');
  const existingProducts = productsResponse.items || productsResponse;
  const prodMap = {};
  for (const p of existingProducts) prodMap[p.name] = p;

  const productsToCreate = [
    { name: 'Wireless Mouse', type: 'PRODUCT', category: 'Computer Accessories', unit: 'Piece', cost: 300, sell: 500, code: 'ACC-MOU-01', stock: 120 },
    { name: 'USB Keyboard', type: 'PRODUCT', category: 'Computer Accessories', unit: 'Piece', cost: 400, sell: 650, code: 'ACC-KEY-01', stock: 80 },
    { name: '64GB Pendrive', type: 'PRODUCT', category: 'Storage', unit: 'Piece', cost: 500, sell: 750, code: 'STO-PEN-64', stock: 150 },
    { name: '128GB Pendrive', type: 'PRODUCT', category: 'Storage', unit: 'Piece', cost: 900, sell: 1200, code: 'STO-PEN-128', stock: 100 },
    { name: 'HDMI Cable 2m', type: 'PRODUCT', category: 'Computer Accessories', unit: 'Piece', cost: 150, sell: 300, code: 'ACC-CBL-HD2', stock: 200 },
    { name: 'HDMI Cable 5m', type: 'PRODUCT', category: 'Computer Accessories', unit: 'Piece', cost: 250, sell: 450, code: 'ACC-CBL-HD5', stock: 100 },
    { name: 'SSD 256GB', type: 'PRODUCT', category: 'Storage', unit: 'Piece', cost: 2000, sell: 2500, code: 'STO-SSD-256', stock: 40 },
    { name: 'SSD 512GB', type: 'PRODUCT', category: 'Storage', unit: 'Piece', cost: 3500, sell: 4200, code: 'STO-SSD-512', stock: 30 },
    { name: 'RAM 8GB DDR4', type: 'PRODUCT', category: 'Computer Accessories', unit: 'Piece', cost: 1800, sell: 2200, code: 'ACC-RAM-08', stock: 60 },
    { name: 'RAM 16GB DDR4', type: 'PRODUCT', category: 'Computer Accessories', unit: 'Piece', cost: 3400, sell: 4000, code: 'ACC-RAM-16', stock: 40 },
    { name: 'Cat6 Ethernet Cable', type: 'PRODUCT', category: 'Networking', unit: 'Meter', cost: 15, sell: 25, code: 'NET-CAT6', stock: 1000 },
    { name: 'Wi-Fi Router AC1200', type: 'PRODUCT', category: 'Networking', unit: 'Piece', cost: 1500, sell: 2200, code: 'NET-RTR-AC', stock: 25 },
    { name: 'Bluetooth Earbuds', type: 'PRODUCT', category: 'Audio', unit: 'Piece', cost: 800, sell: 1500, code: 'AUD-EAR-BT', stock: 50 },
    { name: 'Wired Headphones', type: 'PRODUCT', category: 'Audio', unit: 'Piece', cost: 500, sell: 850, code: 'AUD-HDP-W', stock: 75 },
    { name: 'Photo Paper 4R', type: 'PRODUCT', category: 'Stationery', unit: 'Piece', cost: 2, sell: 5, code: 'STA-PP-4R', stock: 5000 },
    { name: 'A4 Printing Paper (Ream)', type: 'PRODUCT', category: 'Stationery', unit: 'Set', cost: 300, sell: 400, code: 'STA-PP-A4', stock: 200 },
    { name: 'Ballpoint Pen Box', type: 'PRODUCT', category: 'Stationery', unit: 'Box', cost: 120, sell: 180, code: 'STA-PEN-BOX', stock: 150 },
    { name: 'A4 Black & White Print', type: 'SERVICE', category: 'Printing', unit: 'Page', cost: 2, sell: 5, code: 'SRV-PRT-BWA4' },
    { name: 'A4 Color Print', type: 'SERVICE', category: 'Printing', unit: 'Page', cost: 5, sell: 15, code: 'SRV-PRT-CLA4' },
    { name: 'Photocopy A4', type: 'SERVICE', category: 'Photocopy', unit: 'Copy', cost: 1.5, sell: 3, code: 'SRV-CPY-A4' },
    { name: 'Passport Photography', type: 'SERVICE', category: 'Photography', unit: 'Service', cost: 0, sell: 100, code: 'SRV-PHO-PP' },
    { name: 'Wedding Photography', type: 'SERVICE', category: 'Photography', unit: 'Service', cost: 0, sell: 15000, code: 'SRV-PHO-WD' },
    { name: 'Online Form Fill-up', type: 'SERVICE', category: 'Online Services', unit: 'Service', cost: 0, sell: 50, code: 'SRV-ONL-FF' },
    { name: 'CV Writing', type: 'SERVICE', category: 'Creative Services', unit: 'Service', cost: 0, sell: 300, code: 'SRV-CRE-CV' },
    { name: 'Logo Design', type: 'SERVICE', category: 'Creative Services', unit: 'Service', cost: 0, sell: 1000, code: 'SRV-CRE-LOG' }
  ];

  for (const p of productsToCreate) {
    if (!prodMap[p.name]) {
      log(`Creating product: ${p.name}`);
      try {
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

        if (p.type === 'PRODUCT' && p.stock && created.variants && created.variants.length > 0) {
          log(`Adding stock for ${p.name}`);
          const wh1 = Math.floor(p.stock * 0.6);
          const wh2 = p.stock - wh1;
          await post('/inventory/adjustments', {
            warehouseId: warehouses[0].id,
            variantId: created.variants[0].id,
            quantity: wh1,
            type: 'ADJUSTMENT_IN',
            notes: 'Initial Opening Stock (Main)'
          });
          if (wh2 > 0) {
            await post('/inventory/adjustments', {
              warehouseId: warehouses[1].id,
              variantId: created.variants[0].id,
              quantity: wh2,
              type: 'ADJUSTMENT_IN',
              notes: 'Initial Opening Stock (Secondary)'
            });
          }
        }
      } catch (e) {
        log(`Failed to create product ${p.name}, skipping. Error: ${e.message}`);
      }
    }
  }

  log('Ensuring Suppliers exist...');
  const existingSuppliers = await get('/business-core/suppliers');
  const supMap = {};
  for (const s of existingSuppliers) supMap[s.name] = s.id;
  const supplierNames = [
    'Tech Accessories Ltd.', 'Paper House BD', 'Global Photographics', 'Computer Hardware Co.', 
    'Network Solutions Inc.', 'Creative Print Supplies', 'Stationery Wholesale BD', 'Audio World'
  ];
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
    'Local High School', 'City Bank Branch', 'Dhaka University Student', 'XYZ Small Business',
    'Creative Agency LLC', 'Tech Startup BD', 'Medical College Hospital', 'Primary School'
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
  const sales = await get('/sales');
  if (sales.length < 30) {
    const methods = ['CASH', 'BANK', 'MOBILE_BANKING', 'OTHER'];
    for(let i = 0; i < 40; i++) {
      const cName = customerNames[Math.floor(Math.random() * customerNames.length)];
      const p1 = productsToCreate[Math.floor(Math.random() * productsToCreate.length)];
      const p2 = productsToCreate[Math.floor(Math.random() * productsToCreate.length)];
      
      const v1 = prodMap[p1.name]?.variants?.[0]?.id;
      const v2 = prodMap[p2.name]?.variants?.[0]?.id;
      
      if (!v1 || !v2) continue;

      const q1 = Math.floor(Math.random() * 5) + 1;
      const q2 = Math.floor(Math.random() * 10) + 1;
      
      const t1 = p1.sell * q1;
      const t2 = p2.sell * q2;
      const total = t1 + t2;

      const isPartial = Math.random() < 0.2;
      const amountPaid = isPartial ? Math.floor(total * (Math.random() * 0.5 + 0.2)) : total;
      
      const method = methods[Math.floor(Math.random() * methods.length)];

      const wh = warehouses[Math.floor(Math.random() * 2)];
      try {
        await post('/sales/complete-direct', {
          branchId: wh.branchId, 
          warehouseId: wh.id,
          customerId: custMap[cName],
          lines: [
            { variantId: v1, quantity: q1 },
            { variantId: v2, quantity: q2 }
          ],
          payments: amountPaid > 0 ? [{ method, amount: amountPaid }] : []
        });
      } catch (err) {
        // ignore stock errors for demo sales, just move to next
      }
    }
  }

  log('Generating Demo Purchases...');
  const purchases = await get('/purchases');
  if (purchases.length < 15) {
    for(let i = 0; i < 20; i++) {
      const sName = supplierNames[Math.floor(Math.random() * supplierNames.length)];
      const productOnly = productsToCreate.filter(p => p.type === 'PRODUCT');
      const p1 = productOnly[Math.floor(Math.random() * productOnly.length)];
      
      const v1 = prodMap[p1.name]?.variants?.[0]?.id;
      if (!v1) continue;
      
      const q1 = Math.floor(Math.random() * 50) + 10;
      const total = p1.cost * q1;
      
      const purchase = await post('/purchases', {
        branchId: branches[0].id, 
        warehouseId: warehouses[0].id,
        supplierId: supMap[sName],
        purchaseDate: new Date().toISOString(),
        lines: [
          { variantId: v1, quantity: q1, unitCost: p1.cost }
        ]
      });

      if (Math.random() < 0.7) {
        await post(`/purchases/${purchase.id}/complete`, { notes: 'Received in full' });
        await post(`/purchases/${purchase.id}/payments`, {
          method: 'BANK', 
          amount: total, 
          reference: 'TRX-' + Math.floor(Math.random()*10000),
          paymentDate: new Date().toISOString()
        });
      }
    }
  }

  log('Triggering Finance Integration...');
  await post('/finance-integration/process', {});

  log('Backdating transactions...');
  const allSales = await prisma.sale.findMany();
  const allPurchases = await prisma.purchase.findMany();
  
  for(const s of allSales) {
    const daysAgo = Math.floor(Math.random() * 90);
    const randomDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    await prisma.sale.update({ where: { id: s.id }, data: { createdAt: randomDate }});
    await prisma.saleLine.updateMany({ where: { saleId: s.id }, data: { createdAt: randomDate }});
    await prisma.salePayment.updateMany({ where: { saleId: s.id }, data: { createdAt: randomDate }});
  }
  
  for(const p of allPurchases) {
    const daysAgo = Math.floor(Math.random() * 90);
    const randomDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    await prisma.purchase.update({ where: { id: p.id }, data: { createdAt: randomDate }});
    await prisma.purchaseLine.updateMany({ where: { purchaseId: p.id }, data: { createdAt: randomDate }});
    await prisma.purchasePayment.updateMany({ where: { purchaseId: p.id }, data: { createdAt: randomDate }});
  }
  
  const jes = await prisma.journalEntry.findMany();
  for(const je of jes) {
    const daysAgo = Math.floor(Math.random() * 90);
    const randomDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    await prisma.journalEntry.update({ where: { id: je.id }, data: { date: randomDate, createdAt: randomDate }});
  }
  
  const ims = await prisma.inventoryMovement.findMany();
  for(const im of ims) {
    const daysAgo = Math.floor(Math.random() * 90);
    const randomDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    await prisma.inventoryMovement.update({ where: { id: im.id }, data: { createdAt: randomDate }});
  }

  log('Seed process completed successfully!');
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
