const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Initializing base records...');

  // Upsert Organization 1
  const org = await prisma.organization.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'Demo Business Inc.',
      timezone: 'Asia/Dhaka',
    }
  });
  console.log('Organization created/found:', org.id);

  // Need a default BusinessUnit for the branch API if it requires it,
  // let's check if there is any business unit, if not create one.
  const buCount = await prisma.businessUnit.count({ where: { organizationId: '1' } });
  if (buCount === 0) {
    const bu = await prisma.businessUnit.create({
      data: {
        organizationId: '1',
        name: 'Main Business Unit',
        type: 'RETAIL'
      }
    });
    console.log('Created BusinessUnit:', bu.id);
  }

  // Create admin user 1 just in case
  const user = await prisma.user.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      organizationId: '1',
      email: 'naimur582582@gmail.com',
      password: 'hashed_password_here',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true
    }
  });
  console.log('User created/found:', user.id);

  console.log('Base initialization done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
