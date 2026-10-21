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
  'finance.view',
  'finance.manage',
  'iam.users.view',
  'iam.users.create',
  'iam.users.update',
  'iam.users.manage',
  'iam.roles.view',
  'iam.roles.create',
  'iam.roles.delete',
  'iam.roles.manage',
  'read:users',
  'manage:users',
  'read:roles',
  'manage:roles',
  'read:customers',
  'manage:customers',
  'catalog.manage',
  'catalog.view',
  'businesscore.customers.view',
  'businesscore.customers.manage',
  'businesscore.categories.view',
  'businesscore.categories.manage',
  'businesscore.suppliers.view',
  'businesscore.suppliers.manage',
  'businesscore.units.view',
  'businesscore.units.manage',
  'reports.dashboard.view',
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

  // 4b. Ensure Manager role has appropriate permissions
  const managerRole = await prisma.role.findFirst({
    where: { organizationId: org.id, name: 'Manager' },
  });
  if (managerRole) {
    const managerAllowed = [
      'sales.view', 'sales.create', 'sales.manage',
      'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.manage',
      'catalog.view', 'catalog.manage',
      'operational.branches.view', 'operational.warehouses.view',
      'finance.journal.view', 'reports.dashboard.view',
      'businesscore.customers.view', 'businesscore.customers.manage',
      'iam.users.view', 'iam.roles.view',
      'read:customers', 'manage:customers', 'read:users', 'read:roles',
    ];
    for (const perm of permissions) {
      if (managerAllowed.includes(perm.action)) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: managerRole.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: managerRole.id,
            permissionId: perm.id,
          },
        });
      }
    }
    console.log(`Assigned management permissions to Manager role (${managerRole.id}).`);
  }

  // 5. Hash password with argon2
  const rawPassword = '5825825825iW.';
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

  // Also update demo admin account
  await prisma.user.updateMany({
    where: { email: 'admin@demo.local' },
    data: { password: hashedPassword }
  });

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
