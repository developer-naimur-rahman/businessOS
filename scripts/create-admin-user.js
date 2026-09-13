const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  'sales.view',
  'sales.create',
  'sales.manage',
  'inventory.view',
  'inventory.adjust',
  'inventory.transfer',
  'inventory.manage',
  'operational.branches.view',
  'operational.branches.manage',
  'operational.warehouses.view',
  'operational.warehouses.manage',
  'finance.journal.create',
  'finance.journal.view',
  'finance.integration.process',
  'iam.users.manage',
  'iam.roles.manage',
  'catalog.manage',
  'catalog.view',
];

async function main() {
  console.log('Connecting to database...');

  // 1. Get or create organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    console.log('Creating default organization...');
    org = await prisma.organization.create({
      data: {
        name: 'My Business OS',
        timezone: 'Asia/Dhaka',
      },
    });
  }
  console.log(`Using organization: ${org.name} (${org.id})`);

  // 2. Ensure all permissions exist
  for (const action of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action },
      update: {},
      create: { action, description: `Permission for ${action}` },
    });
  }
  const permissions = await prisma.permission.findMany();
  console.log(`Ensured ${permissions.length} permissions exist.`);

  // 3. Ensure Admin role exists for this organization
  let adminRole = await prisma.role.findFirst({
    where: { organizationId: org.id, name: 'Admin' },
  });
  if (!adminRole) {
    console.log('Creating Admin role...');
    adminRole = await prisma.role.create({
      data: {
        organizationId: org.id,
        name: 'Admin',
        description: 'Super administrator with full access',
      },
    });
  }

  // 4. Assign all permissions to Admin role
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log(`Assigned all permissions to Admin role (${adminRole.id}).`);

  // 5. Hash password with argon2
  const rawPassword = '5825825iW.';
  const email = 'naimur582582@gmail.com';
  const hashedPassword = await argon2.hash(rawPassword);

  // 6. Upsert user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      isActive: true,
      organizationId: org.id,
    },
    create: {
      email,
      password: hashedPassword,
      firstName: 'Naimur',
      lastName: 'Rahman',
      organizationId: org.id,
      isActive: true,
    },
  });
  console.log(`User created/updated: ${user.email} (ID: ${user.id})`);

  // 7. Assign user to Admin role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: adminRole.id,
    },
  });
  console.log(`User assigned to Admin role successfully.`);

  // 8. Verify password
  const verifyMatch = await argon2.verify(user.password, rawPassword);
  console.log(`Password verification test: ${verifyMatch ? 'SUCCESS' : 'FAILED'}`);
}

main()
  .catch((e) => {
    console.error('Error seeding admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
