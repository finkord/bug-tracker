import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SeedService } from '../modules/admin/seed.service.js';

async function runSeedCli() {
  console.log('[SEED:DEMO] Initializing BugTracker Database Seeder Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const seedService = app.get(SeedService);
    const result = await seedService.runSeed({ clean: true });

    console.log('\n======================================================');
    console.log('[OK] DATABASE SEEDING COMPLETED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`Teams / Projects Created:     ${result.projectsCount}`);
    console.log(`Engineers & Leads Created:    ${result.usersCount}`);
    console.log(`Authentic Tickets Created:    ${result.issuesCount}`);
    console.log(`Cross-Team Links Created:     ${result.linksCount}`);
    console.log(`Worklogs Generated:           ${result.worklogsCount}`);
    console.log(`Issue Comments Created:       ${result.commentsCount}`);
    console.log('======================================================\n');
    console.log('Default Login Credentials:');
    console.log('   - Admin / UI Lead:    volodymyr@bugtracker.local (Password123!)');
    console.log('   - CORE Platform Lead: alex.mercer@bugtracker.local (Password123!)');
    console.log('   - SRE / MON Lead:     sarah.chen@bugtracker.local (Password123!)');
    console.log('   - Cloud / INFRA Lead: david.miller@bugtracker.local (Password123!)');
    console.log('   - SecOps / NET Lead:  elena.rostova@bugtracker.local (Password123!)');
    console.log('======================================================\n');
  } catch (error) {
    console.error('[ERROR] Database seeding failed with error:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

await runSeedCli();
