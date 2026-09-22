const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.product.findFirst({ include: { variants: true }});
  const s = await prisma.sale.findFirst({ include: { lines: true, payments: true }});
  const pur = await prisma.purchase.findFirst({ include: { lines: true, payments: true }});
  
  console.log("PRODUCT:", p);
  console.log("SALE:", s);
  console.log("PURCHASE:", pur);
}

main().catch(console.error).finally(() => prisma.$disconnect());
