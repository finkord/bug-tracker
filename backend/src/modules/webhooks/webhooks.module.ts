import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ProjectWebhook } from './entities/project-webhook.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';
import { RbacModule } from '../rbac/rbac.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectWebhook, Project]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RbacModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
