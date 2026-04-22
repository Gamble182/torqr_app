import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';

async function createTestUser() {
  const testUser = {
    email: 'test@torqr.app',
    password: 'Test123!',
    name: 'Test User',
  };

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    if (existingUser) {
      console.log('⚠️  Test user already exists with email:', testUser.email);
      console.log('Updating password...');

      const passwordHash = await hashPassword(testUser.password);
      await prisma.user.update({
        where: { email: testUser.email },
        data: { passwordHash },
      });

      console.log('✅ Password updated successfully!');
    } else {
      // Hash the password
      const passwordHash = await hashPassword(testUser.password);

      // Create company + user
      const company = await prisma.company.create({ data: {} });
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          passwordHash,
          name: testUser.name,
          companyId: company.id,
          role: 'OWNER',
        },
      });

      console.log('✅ Test user created successfully!');
      console.log('User ID:', user.id);
    }

    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:   ', testUser.email);
    console.log('Password:', testUser.password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
