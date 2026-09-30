import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SystemInitService } from '../modules/admin/system-init.service.js';

async function runSystemInitCli() {
  console.log('[INIT] Initializing BugTracker System Context...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const initService = app.get(SystemInitService);
    const result = await initService.initializeSystem();

    console.log('\n======================================================');
    console.log('[OK] BUGTRACKER SYSTEM INITIALIZATION COMPLETE');
    console.log('======================================================');
    console.log(`Administrator Email:       ${result.adminEmail}`);
    console.log(`Administrator Status:      ${result.adminCreated ? 'Newly Created' : 'Already Exists'}`);
    console.log(`System Groups Initialized: ${result.groupsCount}`);
    console.log(`Project Roles Initialized: ${result.rolesCount}`);
    console.log(`Permission Scheme ID:      ${result.permissionSchemeId}`);
    console.log(`Security Scheme ID:        ${result.securitySchemeId}`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('[ERROR] System initialization failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

await runSystemInitCli();
