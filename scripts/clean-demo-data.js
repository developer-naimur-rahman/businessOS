const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning demo data...');
  try {
    const orgId = '1';
    
    // Order matters for foreign keys
    await prisma.$executeRawUnsafe(`DELETE FROM "SalePayment"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "SaleLine"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Sale"`);
    
    await prisma.$executeRawUnsafe(`DELETE FROM "PurchasePayment"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "PurchaseLine"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Purchase"`);
    
    await prisma.$executeRawUnsafe(`DELETE FROM "InventoryMovement"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "StockBalance"`);
    
    await prisma.$executeRawUnsafe(`DELETE FROM "ProductVariantBarcode"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "VariantAttribute"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "ProductMedia"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "ProductVariant"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Product"`);
    
    await prisma.$executeRawUnsafe(`DELETE FROM "AttributeValue"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Attribute"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Category"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Unit"`);
    
    await prisma.$executeRawUnsafe(`DELETE FROM "Customer"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Supplier"`);
    
    await prisma.$executeRawUnsafe(`DELETE FROM "Warehouse"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Branch"`);
    
    console.log('Cleaned.');
  } catch (e) {
    console.error('Error during clean:', e);
  }
}

clean().catch(console.error).finally(() => prisma.$disconnect());
