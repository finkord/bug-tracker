import 'reflect-metadata';
import { parseArgs } from 'node:util';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SeedService } from '../modules/admin/seed.service.js';

async function runSeedCli() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      users: { type: 'string', short: 'u' },
      projects: { type: 'string', short: 'p' },
      sprints: { type: 'string', short: 's' },
      issues: { type: 'string', short: 'i' },
      'seed-number': { type: 'string' },
      clean: { type: 'boolean', default: true },
      'no-clean': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: false,
    allowPositionals: true,
  });

  if (values.help) {
    console.log(`
BugTracker Automated Enterprise Data Seeder
Universal CLI tool for development, CI/CD, and production demonstrations.

Usage:
  npm run seed:demo -- [options]
  node dist/database/seed.js [options]

Options:
  --users, -u <count>        Number of users/engineers to seed (default: 25)
  --projects, -p <count>     Number of project workspaces to seed (default: 5)
  --sprints, -s <count>      Total sprints distributed across projects (default: 15)
  --issues, -i <count>       Total tickets to seed across sprints & backlogs (default: 120)
  --seed-number <number>     Faker random seed number for reproducible datasets
  --clean                    Wipe existing database entities before seeding (default: true)
  --no-clean                 Skip database cleanup before seeding
  --help, -h                 Display this help message

Examples:
  npm run seed:demo -- --users=100 --projects=8 --issues=300
  docker exec -it bugtracker-backend-prod node dist/database/seed.js --users=500 --issues=1000
`);
    process.exit(0);
  }

  const usersCount = typeof values.users === 'string' ? parseInt(values.users, 10) : undefined;
  const projectsCount = typeof values.projects === 'string' ? parseInt(values.projects, 10) : undefined;
  const sprintsCount = typeof values.sprints === 'string' ? parseInt(values.sprints, 10) : undefined;
  const issuesCount = typeof values.issues === 'string' ? parseInt(values.issues, 10) : undefined;
  const seedNumber = typeof values['seed-number'] === 'string' ? parseInt(values['seed-number'], 10) : undefined;
  const clean = values['no-clean'] ? false : Boolean(values.clean ?? true);

  console.log('[SEED:DEMO] Initializing BugTracker Database Seeder Application Context...');
  if (usersCount || projectsCount || sprintsCount || issuesCount) {
    console.log(`[SEED:DEMO] Target scale: users=${usersCount ?? 25}, projects=${projectsCount ?? 5}, sprints=${sprintsCount ?? 15}, issues=${issuesCount ?? 120}`);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const seedService = app.get(SeedService);
    const result = await seedService.runSeed({
      clean,
      usersCount,
      projectsCount,
      sprintsCount,
      issuesCount,
      seedNumber,
    });

    console.log('\n======================================================');
    console.log('[OK] DATABASE SEEDING COMPLETED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`Project Workspaces:           ${result.projectsCount}`);
    console.log(`Engineers & Leads Created:    ${result.usersCount}`);
    console.log(`Agile Engineering Teams:      ${result.teamsCount}`);
    console.log(`Authentic Tickets Created:    ${result.issuesCount}`);
    console.log(`Cross-Project Links Created:  ${result.linksCount}`);
    console.log(`Worklogs Generated:           ${result.worklogsCount}`);
    console.log(`Issue Comments Created:       ${result.commentsCount}`);
    console.log(`RBAC Roles & Schemes:         ${result.rolesCount} roles, ${result.schemesCount} schemes`);
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
