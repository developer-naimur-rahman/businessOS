const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.product.create({
      data: {
        name: "TestProduct",
        type: "PRODUCT",
        code: "TP-01",
        organization: { connect: { id: "1" } },
        variants: {
          create: [{
            sku: "SKU-TP-01",
            retailPrice: 0
          }]
        }
      }
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
