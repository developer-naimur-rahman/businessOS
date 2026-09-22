const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.product.findMany({
    where: { type: "SERVICE" },
    select: { name: true, isActive: true, isOnlineVisible: true, status: true }
  });
  console.table(services);
}

main().catch(console.error).finally(() => prisma.$disconnect());
