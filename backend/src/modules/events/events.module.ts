import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway.js';
import { Issue } from '../issues/entities/issue.entity.js';
import { RbacModule } from '../rbac/rbac.module.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Issue]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(
          'JWT_SECRET',
          'super_secret_jwt_access_key_change_in_production_min_32_chars',
        ),
      }),
    }),
    RbacModule,
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
