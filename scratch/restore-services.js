const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  
  await prisma.product.updateMany({
    where: {
      type: "SERVICE",
      name: { not: { contains: "Logo Design" } }
    },
    data: {
      isOnlineVisible: true,
      isActive: true,
      status: "ACTIVE"
    }
  });
  console.log("Restored previous services to be visible online.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
