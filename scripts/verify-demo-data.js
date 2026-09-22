const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('Verifying Demo Data...\n');
  const counts = {
    Users: await prisma.user.count(),
    Branches: await prisma.branch.count(),
    Warehouses: await prisma.warehouse.count(),
    Products: await prisma.product.count(),
    Variants: await prisma.productVariant.count(),
    Customers: await prisma.customer.count(),
    Suppliers: await prisma.supplier.count(),
    Purchases: await prisma.purchase.count(),
    Sales: await prisma.sale.count(),
    SalePayments: await prisma.salePayment.count(),
    PurchasePayments: await prisma.purchasePayment.count(),
    InventoryMovements: await prisma.inventoryMovement.count(),
    StockBalances: await prisma.stockBalance.count(),
    JournalEntries: await prisma.journalEntry.count()
  };

  for (const [key, value] of Object.entries(counts)) {
    if (value > 0) {
      console.log(`[VERIFY] ${key}: OK (${value})`);
    } else {
      console.log(`[VERIFY] ${key}: FAIL (0)`);
    }
  }

  console.log('\nVerification complete.');
}

verify().catch(console.error).finally(() => prisma.$disconnect());
