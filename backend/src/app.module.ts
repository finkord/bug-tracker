import { EventsModule } from './modules/events/events.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { User } from './modules/users/entities/user.entity.js';
import { SavedFilter } from './modules/users/entities/saved-filter.entity.js';
import { LoginAuditLog } from './modules/security-audit/entities/login-audit-log.entity.js';
import { Project } from './modules/projects/entities/project.entity.js';
import { Issue } from './modules/issues/entities/issue.entity.js';
import { Comment } from './modules/issues/entities/comment.entity.js';
import { Worklog } from './modules/issues/entities/worklog.entity.js';
import { Attachment } from './modules/issues/entities/attachment.entity.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { SecurityAuditModule } from './modules/security-audit/security-audit.module.js';
import { CaptchaModule } from './modules/captcha/captcha.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { IssuesModule } from './modules/issues/issues.module.js';

@Module({
  imports: [
    // Global environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),

    // PostgreSQL database connection via TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'bug_tracker'),
        entities: [User, SavedFilter, LoginAuditLog, Project, Issue, Comment, Worklog, Attachment],
        synchronize: true, // Automatically synchronize schema in development
      }),
    }),

    // Rate limiting to mitigate brute-force and DDoS attacks
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds window
        limit: 10,  // Max 10 requests per window
      },
    ]),

    // Transactional email dispatch via Mailpit
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST', 'localhost'),
          port: configService.get<number>('MAIL_PORT', 1025),
          ignoreTLS: true,
          secure: false,
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM', '"Bug Tracker" <no-reply@bugtracker.local>'),
        },
      }),
    }),

    // Application business modules
    AuthModule,
    UsersModule,
    SecurityAuditModule,
    CaptchaModule,
    ProjectsModule,
    IssuesModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
