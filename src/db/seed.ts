import 'dotenv/config';
import { db } from './index';
import { roles } from './schema';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create ADMIN role with all permissions set to true
    await db.insert(roles).values({
      name: 'ADMIN',
      canPostLogin: true,
      canGetMyUser: true,
      canGetUsers: true
    });
    console.log('✅ ADMIN role created');

    // Create USER role with canGetUsers set to false
    await db.insert(roles).values({
      name: 'USER',
      canPostLogin: true,
      canGetMyUser: true,
      canGetUsers: false
    });
    console.log('✅ USER role created');

    // Create BAN role with all permissions set to false
    await db.insert(roles).values({
      name: 'BAN',
      canPostLogin: false,
      canGetMyUser: false,
      canGetUsers: false
    });
    console.log('✅ BAN role created');

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();

