import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { User } from './entities/user.entity.js';
import { SavedFilter } from './entities/saved-filter.entity.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';

import { Group } from '../rbac/entities/group.entity.js';
import { UserGroup } from '../rbac/entities/user-group.entity.js';
import { StorageModule } from '../storage/storage.module.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, SavedFilter, Group, UserGroup]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    StorageModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
