const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    take: 10,
    where: { type: 'SERVICE' },
    select: { id: true, name: true, description: true }
  });
  console.log(products);
}

main().catch(console.error).finally(() => prisma.$disconnect());
