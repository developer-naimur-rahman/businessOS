const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("No org");

  let coa = await prisma.chartOfAccounts.findFirst({ where: { organizationId: org.id } });
  if (!coa) {
    coa = await prisma.chartOfAccounts.create({
      data: {
        organizationId: org.id,
        name: "Default COA"
      }
    });
  }

  const accounts = [
    { code: "1001", name: "Cash", type: "ASSET" },
    { code: "1002", name: "Bank", type: "ASSET" },
    { code: "1003", name: "Mobile Banking", type: "ASSET" },
    { code: "1004", name: "Accounts Receivable", type: "ASSET" },
    { code: "4001", name: "Sales Revenue", type: "REVENUE" },
    { code: "4002", name: "Service Revenue", type: "REVENUE" },
  ];

  const createdAccounts = {};
  for (const acc of accounts) {
    let existing = await prisma.account.findFirst({
      where: { chartOfAccountsId: coa.id, code: acc.code }
    });
    if (!existing) {
      existing = await prisma.account.create({
        data: {
          chartOfAccountsId: coa.id,
          code: acc.code,
          name: acc.name,
          type: acc.type
        }
      });
    }
    createdAccounts[acc.name] = existing.id;
  }

  await prisma.financeIntegrationConfig.upsert({
    where: { organizationId: org.id },
    update: {
      cashAccountId: createdAccounts["Cash"],
      bankAccountId: createdAccounts["Bank"],
      mobileBankingAccountId: createdAccounts["Mobile Banking"],
      salesRevenueAccountId: createdAccounts["Sales Revenue"],
      serviceRevenueAccountId: createdAccounts["Service Revenue"],
      accountsReceivableAccountId: createdAccounts["Accounts Receivable"]
    },
    create: {
      organizationId: org.id,
      cashAccountId: createdAccounts["Cash"],
      bankAccountId: createdAccounts["Bank"],
      mobileBankingAccountId: createdAccounts["Mobile Banking"],
      salesRevenueAccountId: createdAccounts["Sales Revenue"],
      serviceRevenueAccountId: createdAccounts["Service Revenue"],
      accountsReceivableAccountId: createdAccounts["Accounts Receivable"]
    }
  });

  // Also need a fiscal period
  let period = await prisma.fiscalPeriod.findFirst({ where: { organizationId: org.id, status: 'OPEN' } });
  if (!period) {
    await prisma.fiscalPeriod.create({
      data: {
        organizationId: org.id,
        name: "FY-2026",
        startDate: new Date("2026-01-01T00:00:00Z"),
        endDate: new Date("2026-12-31T23:59:59Z"),
        status: "OPEN"
      }
    });
  }

  console.log("Finance seeded!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
