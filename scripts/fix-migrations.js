const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`UPDATE _prisma_migrations SET migration_name = '20260913190000_phase3_operational_structure' WHERE migration_name = '20260914000000_phase3_operational_structure';`);
  await prisma.$executeRawUnsafe(`UPDATE _prisma_migrations SET migration_name = '20260913193000_phase4_inventory_foundation' WHERE migration_name = '20260914000001_phase4_inventory_foundation';`);
  console.log('Done');
}
main().finally(() => prisma.$disconnect());
