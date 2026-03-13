import { Module } from '@nestjs/common';
import { MediaController } from './controller/media.controller';
import { MediaService } from './service/media.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MediaRepository } from './repository/media.repository';

@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [MediaService, MediaRepository],
  exports: [MediaService],
})
export class MediaModule {}
