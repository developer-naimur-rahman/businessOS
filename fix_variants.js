const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { variants: true }
  });
  
  let count = 0;
  for (const product of products) {
    if (!product.variants || product.variants.length === 0) {
      console.log(`Fixing product: ${product.name} (${product.id})`);
      await prisma.productVariant.create({
        data: {
          organizationId: product.organizationId,
          productId: product.id,
          sku: product.code ? `SKU-${product.code}` : `VAR-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          retailPrice: product.sellingPrice || 0,
          status: 'ACTIVE'
        }
      });
      count++;
    }
  }
  console.log(`Fixed ${count} products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
