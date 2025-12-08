const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

async function createTestUser() {
  const prisma = new PrismaClient();

  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.upsert({
      where: { email: 'test@test.com' },
      update: {},
      create: {
        email: 'test@test.com',
        password: hashedPassword,
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'User'
          }
        }
      }
    });

    console.log('Usuario creado:', user.email);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
