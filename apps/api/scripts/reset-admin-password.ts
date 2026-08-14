import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/enums';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is missing.`);
  }

  return value.trim();
}

function buildDatabaseUrl(rawUrl: string): string {
  const url = new URL(rawUrl);

  // Render PostgreSQL external connection.
  url.searchParams.set('sslmode', 'no-verify');
  url.searchParams.set('schema', 'public');

  return url.toString();
}

async function runAdminBootstrap(): Promise<void> {
  const rawDatabaseUrl = requireEnv('DATABASE_URL');
  const adminEmail = requireEnv('ADMIN_EMAIL').toLowerCase();
  const adminPassword = requireEnv('ADMIN_PASSWORD');

  if (adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  }

  const connectionString = buildDatabaseUrl(rawDatabaseUrl);

  const adapter = new PrismaPg({
    connectionString,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  try {
    console.log('');
    console.log('==========================================');
    console.log(' EUROATLAS CARGO - ADMIN BOOTSTRAP');
    console.log('==========================================');
    console.log(`Admin email: ${adminEmail}`);
    console.log('Connecting to production database...');
    console.log('');

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const user = await prisma.user.upsert({
      where: {
        email: adminEmail,
      },

      update: {
        password: passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },

      create: {
        email: adminEmail,
        firstName: 'Saleh',
        lastName: 'Alkarabubi',
        password: passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },

      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    console.log('==========================================');
    console.log(' ADMIN USER IS READY');
    console.log('==========================================');
    console.table([user]);
    console.log('');
    console.log('Password successfully hashed with bcrypt.');
    console.log('Plaintext password was NOT stored.');
    console.log('');
  } finally {
    await prisma.$disconnect();
  }
}

async function bootstrap(): Promise<void> {
  try {
    await runAdminBootstrap();
  } catch (error: unknown) {
    console.error('');
    console.error('==========================================');
    console.error(' ADMIN BOOTSTRAP FAILED');
    console.error('==========================================');

    if (error instanceof Error) {
      console.error(error.message);

      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
}

void bootstrap();
