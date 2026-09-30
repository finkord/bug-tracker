import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SeaweedFsService } from './services/seaweedfs.service.js';

@Module({
  imports: [ConfigModule],
  providers: [SeaweedFsService],
  exports: [SeaweedFsService],
})
export class StorageModule {}
