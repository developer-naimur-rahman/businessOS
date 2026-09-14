const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No users found in database.');
      return;
    }

    const hashedPassword = await argon2.hash('5825825825iW.');

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log(`Successfully updated password for user: ${user.email}`);
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
