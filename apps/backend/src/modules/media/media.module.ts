import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { MediaController } from './controller/media.controller';
import { MediaService } from './service/media.service';
import { MediaProcessor } from './processor/media.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { MediaRepository } from './repository/media.repository';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'media-processing',
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, MediaRepository, MediaProcessor],
  exports: [MediaService],
})
export class MediaModule {}
