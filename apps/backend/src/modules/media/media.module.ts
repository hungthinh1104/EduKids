import { Module } from '@nestjs/common';
import { MediaController } from './controller/media.controller';
import { MediaService } from './service/media.service';

@Module({
  imports: [],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
