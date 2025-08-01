import { Module } from '@nestjs/common';
import { QiitaModule } from './qiita/qiita.module';

@Module({
  imports: [QiitaModule],
})
export class AppModule {}