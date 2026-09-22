import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { LoginAuditLog } from './entities/login-audit-log.entity.js';
import { SecurityAuditService } from './security-audit.service.js';
import { SecurityAuditController } from './security-audit.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoginAuditLog]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [SecurityAuditController],
  providers: [SecurityAuditService],
  exports: [SecurityAuditService],
})
export class SecurityAuditModule {}

